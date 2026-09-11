import assert from 'node:assert/strict';
import {
  computeCanonicalHash,
  generateTaskId,
  Task,
  EvidenceEnvelope,
} from '../packages/shared/src/index.js';
import { verifierEngine } from '../services/gateway/src/verifier.js';
import { db } from '../services/gateway/src/supabase.js';
import { executeDeterministicTask } from '../provider/mcp-server/src/tool.js';



async function runDemoE2E() {
  console.log('===============================================================');
  console.log('🚀 Running VAEP Automated End-to-End Test Suite');
  console.log('===============================================================\n');

  const buyer = 'GBUYER_E2E_TEST_KEY_1234567890123456789012345678901234567890';
  const provider = 'GPROVIDER_E2E_TEST_KEY_1234567890123456789012345678901234567';
  const now = Math.floor(Date.now() / 1000);

  // ---------------------------------------------------------------------------
  // SCENARIO 1: Happy Path (Deterministic Verification & Release)
  // ---------------------------------------------------------------------------
  console.log('▶ [Scenario 1] Testing Deterministic Verification & Fund Release...');
  const input1 = {
    text: 'Stellar Soroban escrow verification protocol for autonomous AI agents is secure and fast.',
    algorithm: 'sentiment-v1',
  };
  const inputHash1 = computeCanonicalHash(input1);
  const taskId1 = generateTaskId(buyer, provider, 's1-nonce', inputHash1);

  const task1: Task = {
    taskId: taskId1,
    buyer,
    provider,
    serviceId: 'text-sentiment-analyzer',
    inputHash: inputHash1,
    amount: '5000000',
    asset: 'native',
    createdAt: now,
    deadline: now + 300,
    verificationPolicyId: 'deterministic-v1',
    nonce: 's1-nonce',
    state: 'CREATED',
  };
  await db.saveTask(task1);

  // Fund & Start
  await db.updateTaskState(taskId1, 'FUNDED', 'tx_fund_1');
  await db.updateTaskState(taskId1, 'IN_PROGRESS');

  // Execute MCP provider tool to produce genuine evidence
  const { result: validResult1, outputHash: outputHash1, evidenceEnvelope: evidence1 } =
    executeDeterministicTask(taskId1, input1);

  await db.saveEvidence(evidence1);
  await db.updateTaskState(taskId1, 'PROOF_SUBMITTED');

  // Run Verifier Engine
  const verifyResult1 = await verifierEngine.verify(task1, evidence1, input1);
  assert.equal(verifyResult1.decision, 'APPROVE', 'Scenario 1: Deterministic check must APPROVE valid output');
  assert.equal(verifyResult1.hashMatch, true);
  await db.updateTaskState(taskId1, 'RELEASED', 'tx_release_1');

  const settledTask1 = await db.getTask(taskId1);
  assert.equal(settledTask1?.state, 'RELEASED');
  console.log('✅ Scenario 1 PASSED: Canonical hash matched, escrow funds released!\n');

  // ---------------------------------------------------------------------------
  // SCENARIO 2: Bad Result / Malicious Provider Attack
  // ---------------------------------------------------------------------------
  console.log('▶ [Scenario 2] Testing Tampered Result & Verification Rejection...');
  const input2 = {
    text: 'Stellar and Soroban provide robust cryptographic trust guarantees.',
    algorithm: 'sentiment-v1',
  };
  const inputHash2 = computeCanonicalHash(input2);
  const taskId2 = generateTaskId(buyer, provider, 's2-nonce', inputHash2);

  const task2: Task = {
    taskId: taskId2,
    buyer,
    provider,
    serviceId: 'text-sentiment-analyzer',
    inputHash: inputHash2,
    amount: '5000000',
    asset: 'native',
    createdAt: now,
    deadline: now + 300,
    verificationPolicyId: 'deterministic-v1',
    nonce: 's2-nonce',
    state: 'PROOF_SUBMITTED',
  };
  await db.saveTask(task2);

  // Tampered result (mismatched metrics)
  const tamperedResult = {
    algorithm: 'sentiment-v1',
    metrics: { characterCount: 9999, wordCount: 9999, sentimentPolarity: 'TAMPERED', score: -99 },
    serviceVersion: '1.0.0',
    status: 'COMPLETED',
  };
  const tamperedHash = computeCanonicalHash(tamperedResult);

  const evidence2: EvidenceEnvelope = {
    taskId: taskId2,
    evidenceId: 'ev-s2',
    outputHash: tamperedHash,
    artifactUri: `cas://${tamperedHash}`,
    providerSignature: 'sig_provider_s2',
    rawPayload: tamperedResult,
    submittedAt: now,
    proofType: 'recompute',
    proofVersion: '1.0',
  };

  const verifyResult2 = await verifierEngine.verify(task2, evidence2, input2);
  assert.equal(verifyResult2.decision, 'REJECT', 'Scenario 2: Tampered hash must be REJECTED');
  assert.equal(verifyResult2.hashMatch, false);
  await db.updateTaskState(taskId2, 'REFUNDED', 'tx_refund_2');

  const refundedTask2 = await db.getTask(taskId2);
  assert.equal(refundedTask2?.state, 'REFUNDED');
  console.log('✅ Scenario 2 PASSED: Malicious evidence caught, buyer refunded!\n');

  // ---------------------------------------------------------------------------
  // SCENARIO 3: Provider Timeout / Disappearance
  // ---------------------------------------------------------------------------
  console.log('▶ [Scenario 3] Testing Provider Timeout Expiry...');
  const taskId3 = generateTaskId(buyer, provider, 's3-nonce', inputHash1);
  const expiredDeadline = now - 10; // Already passed!

  const task3: Task = {
    taskId: taskId3,
    buyer,
    provider,
    serviceId: 'text-sentiment-analyzer',
    inputHash: inputHash1,
    amount: '5000000',
    asset: 'native',
    createdAt: now - 100,
    deadline: expiredDeadline,
    verificationPolicyId: 'deterministic-v1',
    nonce: 's3-nonce',
    state: 'FUNDED',
  };
  await db.saveTask(task3);

  // Verification attempt after deadline
  const verifyResult3 = await verifierEngine.verify(task3, evidence1, input1);
  assert.equal(verifyResult3.decision, 'REJECT');
  assert.equal(verifyResult3.policyUsed, 'timeout-refund-v1');

  await db.updateTaskState(taskId3, 'REFUNDED', 'tx_expire_3');
  const expiredTask3 = await db.getTask(taskId3);
  assert.equal(expiredTask3?.state, 'REFUNDED');
  console.log('✅ Scenario 3 PASSED: Timeout enforced, buyer funds protected!\n');

  // ---------------------------------------------------------------------------
  // SCENARIO 4: 2-of-3 Verifier Quorum
  // ---------------------------------------------------------------------------
  console.log('▶ [Scenario 4] Testing 2-of-3 Multi-Verifier Quorum Resolution...');
  const taskId4 = generateTaskId(buyer, provider, 's4-nonce', inputHash1);
  const task4: Task = {
    taskId: taskId4,
    buyer,
    provider,
    serviceId: 'text-sentiment-analyzer',
    inputHash: inputHash1,
    amount: '5000000',
    asset: 'native',
    createdAt: now,
    deadline: now + 300,
    verificationPolicyId: 'quorum-2-of-3-v1',
    nonce: 's4-nonce',
    state: 'PROOF_SUBMITTED',
  };
  await db.saveTask(task4);

  const verifyResult4 = await verifierEngine.verify(task4, evidence1, input1);
  assert.equal(verifyResult4.decision, 'APPROVE');
  assert.equal(verifyResult4.attestations.length, 3, 'Must record 3 independent verifier attestations');

  const approveVotes = verifyResult4.attestations.filter((a) => a.decision === 'APPROVE').length;
  assert.ok(approveVotes >= 2, 'Must satisfy 2-of-3 quorum');
  console.log(`✅ Scenario 4 PASSED: 2-of-3 Quorum achieved (${approveVotes}/3 verifier approvals)!\n`);

  console.log('===============================================================');
  console.log('🎉 ALL 4 E2E PROTOCOL SCENARIOS VERIFIED SUCCESSFULLY!');
  console.log('===============================================================');
}

runDemoE2E().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
