import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';

import {
  computeCanonicalHash,
  generateTaskId,
  Task,
  EvidenceEnvelope,
  CreateTaskSchema,
  FundTaskSchema,
  SubmitEvidenceSchema,
} from '@vaep/shared';
import { db } from './supabase.js';
import { cas } from './cas.js';
import { stellar } from './stellar.js';
import { verifierEngine } from './verifier.js';

const app = Fastify({ logger: true });

app.register(cors, { origin: true });

// Cache raw task inputs in memory for deterministic verification recomputations


const taskInputCache = new Map<string, unknown>();

// -----------------------------------------------------------------------------
// Health & Provider Endpoints
// -----------------------------------------------------------------------------
app.get('/health', async () => {
  return { status: 'ok', protocol: 'VAEP', version: '0.1.0' };
});

app.get('/providers', async () => {
  const providers = await db.listProviders();
  return { providers };
});

// -----------------------------------------------------------------------------
// Task Quote Endpoint
// -----------------------------------------------------------------------------
app.post('/tasks/quote', async (request, reply) => {
  const body = request.body as any;
  const inputHash = computeCanonicalHash(body.inputPayload || {});
  const amount = '5000000'; // 0.5 XLM

  return {
    serviceId: body.serviceId || 'text-sentiment-analyzer',
    providerAddress: 'GPROVIDER_AEGIS_DETERMINISTIC_SERVICE_KEY_12345',
    inputHash,
    amount,
    asset: 'native',
    deadlineSeconds: 120,
    verificationPolicyId: body.verificationPolicyId || 'deterministic-v1',
    quoteExpiry: Math.floor(Date.now() / 1000) + 300,
  };
});

// -----------------------------------------------------------------------------
// Task Lifecycle Endpoints
// -----------------------------------------------------------------------------
app.post('/tasks', async (request, reply) => {
  const parsed = CreateTaskSchema.safeParse(request.body);
  if (!parsed.success) {
    return reply.status(400).send({ error: parsed.error.format() });
  }

  const { buyer, provider, serviceId, inputPayload, amount, asset, deadlineSeconds, verificationPolicyId } = parsed.data;

  const inputHash = computeCanonicalHash(inputPayload);
  const nonce = `${Date.now()}`;
  const taskId = generateTaskId(buyer, provider, nonce, inputHash);

  // Cache input payload for verifier recomputations
  taskInputCache.set(taskId, inputPayload);

  // Store input artifact in CAS
  await cas.saveArtifact({ taskId, inputPayload });

  const now = Math.floor(Date.now() / 1000);
  const deadline = now + deadlineSeconds;

  // Simulate contract creation on Soroban
  const contractTx = await stellar.submitContractTransition('create_escrow', taskId);

  const task: Task = {
    taskId,
    buyer,
    provider,
    serviceId,
    inputHash,
    amount,
    asset,
    createdAt: now,
    deadline,
    verificationPolicyId,
    nonce,
    state: 'CREATED',
    txHashCreate: contractTx.txHash,
  };

  await db.saveTask(task);
  await db.saveEvent({
    id: `evt-${Date.now()}-1`,
    taskId,
    eventType: 'TASK_CREATED',
    actor: buyer,
    payload: { amount, asset, deadline, verificationPolicyId, inputHash },
    txHash: contractTx.txHash,
    timestamp: now,
  });

  return { task, txHash: contractTx.txHash };
});

app.get('/tasks', async () => {
  const tasks = await db.listTasks();
  return { tasks };
});


app.get('/tasks/:taskId', async (request, reply) => {
  const { taskId } = request.params as { taskId: string };
  const task = await db.getTask(taskId);
  if (!task) {
    return reply.status(404).send({ error: 'Task not found' });
  }
  const evidence = await db.getEvidence(taskId);
  const attestations = await db.getAttestations(taskId);

  return { task, evidence, attestations };
});

app.get('/tasks/:taskId/timeline', async (request, reply) => {
  const { taskId } = request.params as { taskId: string };
  const events = await db.getEvents(taskId);
  return { taskId, events };
});

app.post('/tasks/:taskId/fund', async (request, reply) => {
  const { taskId } = request.params as { taskId: string };
  const task = await db.getTask(taskId);
  if (!task) return reply.status(404).send({ error: 'Task not found' });

  if (task.state !== 'CREATED') {
    return reply.status(400).send({ error: `Cannot fund task in state ${task.state}` });
  }

  // Contract fund invocation
  const fundTx = await stellar.submitContractTransition('fund_escrow', taskId);

  await db.updateTaskState(taskId, 'FUNDED', fundTx.txHash);
  await db.saveEvent({
    id: `evt-${Date.now()}-2`,
    taskId,
    eventType: 'ESCROW_FUNDED',
    actor: task.buyer,
    payload: { amount: task.amount, asset: task.asset },
    txHash: fundTx.txHash,
    timestamp: Math.floor(Date.now() / 1000),
  });

  const updated = await db.getTask(taskId);
  return { task: updated, txHash: fundTx.txHash };
});

app.post('/tasks/:taskId/start', async (request, reply) => {
  const { taskId } = request.params as { taskId: string };
  const task = await db.getTask(taskId);
  if (!task) return reply.status(404).send({ error: 'Task not found' });

  if (task.state !== 'FUNDED') {
    return reply.status(400).send({ error: `Cannot start task in state ${task.state}` });
  }

  const startTx = await stellar.submitContractTransition('acknowledge_start', taskId);
  await db.updateTaskState(taskId, 'IN_PROGRESS');
  await db.saveEvent({
    id: `evt-${Date.now()}-3`,
    taskId,
    eventType: 'WORK_STARTED',
    actor: task.provider,
    payload: { status: 'IN_PROGRESS' },
    txHash: startTx.txHash,
    timestamp: Math.floor(Date.now() / 1000),
  });

  const updated = await db.getTask(taskId);
  return { task: updated, txHash: startTx.txHash };
});

app.post('/tasks/:taskId/evidence', async (request, reply) => {
  const { taskId } = request.params as { taskId: string };
  const task = await db.getTask(taskId);
  if (!task) return reply.status(404).send({ error: 'Task not found' });

  const parsed = SubmitEvidenceSchema.safeParse(request.body);
  if (!parsed.success) {
    return reply.status(400).send({ error: parsed.error.format() });
  }

  const { outputHash, rawPayload, providerSignature, proofType } = parsed.data;

  // Persist artifact into Content Addressed Storage
  const savedArtifact = await cas.saveArtifact(rawPayload);

  const evidence: EvidenceEnvelope = {
    taskId,
    evidenceId: `ev-${Date.now()}`,
    outputHash,
    artifactUri: savedArtifact.uri,
    providerSignature,
    rawPayload,
    submittedAt: Math.floor(Date.now() / 1000),
    proofType,
    proofVersion: '1.0',
  };

  await db.saveEvidence(evidence);

  const proofTx = await stellar.submitContractTransition('submit_proof_commitment', taskId);
  await db.updateTaskState(taskId, 'PROOF_SUBMITTED');

  await db.saveEvent({
    id: `evt-${Date.now()}-4`,
    taskId,
    eventType: 'PROOF_SUBMITTED',
    actor: task.provider,
    payload: { outputHash, artifactUri: savedArtifact.uri, proofType },
    txHash: proofTx.txHash,
    timestamp: Math.floor(Date.now() / 1000),
  });

  const updated = await db.getTask(taskId);
  return { task: updated, evidence, txHash: proofTx.txHash };
});

app.post('/tasks/:taskId/verify', async (request, reply) => {
  const { taskId } = request.params as { taskId: string };
  const task = await db.getTask(taskId);
  if (!task) return reply.status(404).send({ error: 'Task not found' });

  if (task.state !== 'PROOF_SUBMITTED') {
    return reply.status(400).send({ error: `Task must be in PROOF_SUBMITTED state (current: ${task.state})` });
  }

  const evidence = await db.getEvidence(taskId);
  if (!evidence) {
    return reply.status(400).send({ error: 'No evidence envelope found for this task' });
  }

  const cachedInput = taskInputCache.get(taskId) || { text: 'Stellar Soroban escrow verification test' };
  const result = await verifierEngine.verify(task, evidence, cachedInput);

  if (result.decision === 'APPROVE') {
    // Soroban contract release transition
    const releaseTx = await stellar.submitContractTransition('approve', taskId);
    await db.updateTaskState(taskId, 'RELEASED', releaseTx.txHash);

    await db.saveEvent({
      id: `evt-${Date.now()}-5`,
      taskId,
      eventType: 'VERIFICATION_PASSED',
      actor: result.attestations[0]?.verifierAddress || 'VERIFIER_NETWORK',
      payload: { ...result },
      txHash: releaseTx.txHash,
      timestamp: Math.floor(Date.now() / 1000),
    });

    await db.saveEvent({
      id: `evt-${Date.now()}-6`,
      taskId,
      eventType: 'ESCROW_RELEASED',
      actor: 'SOROBAN_ESCROW_CONTRACT',
      payload: { recipient: task.provider, amount: task.amount },
      txHash: releaseTx.txHash,
      timestamp: Math.floor(Date.now() / 1000),
    });

    const updated = await db.getTask(taskId);
    return { task: updated, verification: result, txHash: releaseTx.txHash };
  } else {
    // Soroban contract reject / refund transition
    const rejectTx = await stellar.submitContractTransition('reject', taskId);
    await db.updateTaskState(taskId, 'REFUNDED', rejectTx.txHash);

    await db.saveEvent({
      id: `evt-${Date.now()}-5`,
      taskId,
      eventType: 'VERIFICATION_FAILED',
      actor: result.attestations[0]?.verifierAddress || 'VERIFIER_NETWORK',
      payload: { ...result },
      txHash: rejectTx.txHash,
      timestamp: Math.floor(Date.now() / 1000),
    });

    await db.saveEvent({
      id: `evt-${Date.now()}-6`,
      taskId,
      eventType: 'ESCROW_REFUNDED',
      actor: 'SOROBAN_ESCROW_CONTRACT',
      payload: { recipient: task.buyer, amount: task.amount },
      txHash: rejectTx.txHash,
      timestamp: Math.floor(Date.now() / 1000),
    });

    const updated = await db.getTask(taskId);
    return { task: updated, verification: result, txHash: rejectTx.txHash };
  }
});

app.post('/tasks/:taskId/expire', async (request, reply) => {
  const { taskId } = request.params as { taskId: string };
  const task = await db.getTask(taskId);
  if (!task) return reply.status(404).send({ error: 'Task not found' });

  const expireTx = await stellar.submitContractTransition('expire', taskId);
  await db.updateTaskState(taskId, 'REFUNDED', expireTx.txHash);

  await db.saveEvent({
    id: `evt-${Date.now()}-7`,
    taskId,
    eventType: 'ESCROW_EXPIRED',
    actor: 'DEADLINE_MONITOR',
    payload: { deadline: task.deadline, refundRecipient: task.buyer, amount: task.amount },
    txHash: expireTx.txHash,
    timestamp: Math.floor(Date.now() / 1000),
  });

  const updated = await db.getTask(taskId);
  return { task: updated, txHash: expireTx.txHash };
});

const PORT = 4000;
app.listen({ port: PORT, host: '0.0.0.0' }, (err, address) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
  console.log(`⚡ VAEP Gateway Server listening on ${address}`);
});
