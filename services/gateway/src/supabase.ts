import * as dotenv from 'dotenv';
import * as path from 'node:path';
import * as fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  Task,
  EvidenceEnvelope,
  VerifierAttestation,
  TaskEvent,
  ProviderRecord,
  EscrowState,
} from '@vaep/shared';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const candidateEnvPaths = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), '../../.env'),
  path.resolve(__dirname, '../.env'),
  path.resolve(__dirname, '../../.env'),
  path.resolve(__dirname, '../../../.env'),
];

for (const envPath of candidateEnvPaths) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
  }
}

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('your-project-id')) {
  throw new Error(
    '❌ FATAL: Supabase credentials (SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY) must be configured in .env. Offline fallback has been permanently disabled per strict online-only protocol architecture.'
  );
}


export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey);
console.log('⚡ Connected directly to online Supabase project:', supabaseUrl);

export const db = {
  async saveTask(task: Task): Promise<void> {
    const { error } = await supabase.from('tasks').upsert({
      task_id: task.taskId,
      buyer: task.buyer,
      provider: task.provider,
      service_id: task.serviceId,
      input_hash: task.inputHash,
      output_schema_hash: task.outputSchemaHash,
      amount: task.amount,
      asset: task.asset,
      deadline: new Date(task.deadline * 1000).toISOString(),
      verification_policy_id: task.verificationPolicyId,
      nonce: task.nonce,
      state: task.state,
      tx_hash_create: task.txHashCreate,
      tx_hash_fund: task.txHashFund,
      tx_hash_settle: task.txHashSettle,
    });

    if (error) {
      throw new Error(`[Supabase saveTask failed] ${error.message} (code: ${error.code})`);
    }
  },

  async getTask(taskId: string): Promise<Task | null> {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('task_id', taskId)
      .maybeSingle();

    if (error) {
      throw new Error(`[Supabase getTask failed] ${error.message}`);
    }
    if (!data) return null;

    return {
      taskId: data.task_id,
      buyer: data.buyer,
      provider: data.provider,
      serviceId: data.service_id,
      inputHash: data.input_hash,
      outputSchemaHash: data.output_schema_hash,
      amount: data.amount,
      asset: data.asset,
      createdAt: Math.floor(new Date(data.created_at).getTime() / 1000),
      deadline: Math.floor(new Date(data.deadline).getTime() / 1000),
      verificationPolicyId: data.verification_policy_id,
      nonce: data.nonce,
      state: data.state,
      txHashCreate: data.tx_hash_create,
      txHashFund: data.tx_hash_fund,
      txHashSettle: data.tx_hash_settle,
    };
  },

  async listTasks(): Promise<Task[]> {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`[Supabase listTasks failed] ${error.message}`);
    }

    return (data || []).map((row) => ({
      taskId: row.task_id,
      buyer: row.buyer,
      provider: row.provider,
      serviceId: row.service_id,
      inputHash: row.input_hash,
      outputSchemaHash: row.output_schema_hash,
      amount: row.amount,
      asset: row.asset,
      createdAt: Math.floor(new Date(row.created_at).getTime() / 1000),
      deadline: Math.floor(new Date(row.deadline).getTime() / 1000),
      verificationPolicyId: row.verification_policy_id,
      nonce: row.nonce,
      state: row.state,
      txHashCreate: row.tx_hash_create,
      txHashFund: row.tx_hash_fund,
      txHashSettle: row.tx_hash_settle,
    }));
  },

  async updateTaskState(taskId: string, state: EscrowState, txHash?: string): Promise<void> {
    const updates: Record<string, unknown> = {
      state,
      updated_at: new Date().toISOString(),
    };

    if (txHash) {
      if (state === 'FUNDED') updates.tx_hash_fund = txHash;
      else if (state === 'RELEASED' || state === 'REFUNDED') updates.tx_hash_settle = txHash;
    }

    const { error } = await supabase.from('tasks').update(updates).eq('task_id', taskId);
    if (error) {
      throw new Error(`[Supabase updateTaskState failed] ${error.message}`);
    }
  },

  async saveEvidence(evidence: EvidenceEnvelope): Promise<void> {
    const { error } = await supabase.from('evidence').insert({
      task_id: evidence.taskId,
      evidence_id: evidence.evidenceId,
      output_hash: evidence.outputHash,
      artifact_uri: evidence.artifactUri,
      provider_signature: evidence.providerSignature,
      raw_payload: evidence.rawPayload,
      proof_type: evidence.proofType,
      proof_version: evidence.proofVersion,
    });

    if (error) {
      throw new Error(`[Supabase saveEvidence failed] ${error.message}`);
    }
  },

  async getEvidence(taskId: string): Promise<EvidenceEnvelope | null> {
    const { data, error } = await supabase
      .from('evidence')
      .select('*')
      .eq('task_id', taskId)
      .maybeSingle();

    if (error) {
      throw new Error(`[Supabase getEvidence failed] ${error.message}`);
    }
    if (!data) return null;

    return {
      taskId: data.task_id,
      evidenceId: data.evidence_id,
      outputHash: data.output_hash,
      artifactUri: data.artifact_uri,
      providerSignature: data.provider_signature,
      rawPayload: data.raw_payload,
      submittedAt: Math.floor(new Date(data.submitted_at).getTime() / 1000),
      proofType: data.proof_type,
      proofVersion: data.proof_version,
    };
  },

  async saveAttestation(attestation: VerifierAttestation): Promise<void> {
    const { error } = await supabase.from('verifier_attestations').insert({
      task_id: attestation.taskId,
      verifier_address: attestation.verifierAddress,
      decision: attestation.decision,
      decision_nonce: attestation.decisionNonce,
      evidence_hash: attestation.evidenceHash,
      signature: attestation.signature,
    });

    if (error) {
      throw new Error(`[Supabase saveAttestation failed] ${error.message}`);
    }
  },

  async getAttestations(taskId: string): Promise<VerifierAttestation[]> {
    const { data, error } = await supabase
      .from('verifier_attestations')
      .select('*')
      .eq('task_id', taskId);

    if (error) {
      throw new Error(`[Supabase getAttestations failed] ${error.message}`);
    }

    return (data || []).map((d) => ({
      taskId: d.task_id,
      verifierAddress: d.verifier_address,
      decision: d.decision,
      decisionNonce: d.decision_nonce,
      evidenceHash: d.evidence_hash,
      signature: d.signature,
      timestamp: Math.floor(new Date(d.created_at).getTime() / 1000),
    }));
  },

  async saveEvent(event: TaskEvent): Promise<void> {
    const { error } = await supabase.from('task_events').insert({
      task_id: event.taskId,
      event_type: event.eventType,
      actor: event.actor,
      payload: event.payload,
      tx_hash: event.txHash,
    });

    if (error) {
      throw new Error(`[Supabase saveEvent failed] ${error.message}`);
    }
  },

  async getEvents(taskId: string): Promise<TaskEvent[]> {
    const { data, error } = await supabase
      .from('task_events')
      .select('*')
      .eq('task_id', taskId)
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(`[Supabase getEvents failed] ${error.message}`);
    }

    return (data || []).map((d) => ({
      id: d.id,
      taskId: d.task_id,
      eventType: d.event_type as any,
      actor: d.actor,
      payload: d.payload,
      txHash: d.tx_hash,
      timestamp: Math.floor(new Date(d.created_at).getTime() / 1000),
    }));
  },

  async listProviders(): Promise<ProviderRecord[]> {
    const { data, error } = await supabase.from('providers').select('*');

    if (error) {
      throw new Error(`[Supabase listProviders failed] ${error.message}`);
    }

    return (data || []).map((d) => ({
      id: d.id,
      stellarAddress: d.stellar_address,
      name: d.name,
      description: d.description,
      capabilities: d.capabilities,
      priceStroops: d.price_stroops,
      slaSeconds: d.sla_seconds,
      reputationScore: d.reputation_score,
      totalCompleted: d.total_completed,
      totalFaulted: d.total_faulted,
      active: d.active,
    }));
  },
};
