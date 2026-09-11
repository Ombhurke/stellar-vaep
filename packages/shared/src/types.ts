/**
 * Authoritative Escrow State Machine States
 */
export type EscrowState =
  | 'CREATED'
  | 'FUNDED'
  | 'IN_PROGRESS'
  | 'PROOF_SUBMITTED'
  | 'VERIFIED'
  | 'RELEASED'
  | 'REFUNDED'
  | 'DISPUTED'
  | 'EXPIRED';

/**
 * Verification Decisions
 */
export type VerificationDecision = 'APPROVE' | 'REJECT' | 'ABSTAIN';

/**
 * Built-in Verification Policies
 */
export type VerificationPolicyId =
  | 'deterministic-v1'
  | 'quorum-2-of-3-v1'
  | 'timeout-refund-v1';

/**
 * Task Model
 */
export interface Task {
  taskId: string; // 32-byte hex hash
  buyer: string; // Stellar public key (G...)
  provider: string; // Stellar public key (G...)
  serviceId: string; // e.g. "text-analyzer-v1"
  inputHash: string; // SHA-256 of canonical input
  outputSchemaHash?: string;
  amount: string; // Stringified stroops or token units (e.g. "5000000" for 0.5 XLM)
  asset: string; // Stellar asset code / contract ID
  createdAt: number; // Unix timestamp in seconds
  deadline: number; // Expiry timestamp in seconds
  verificationPolicyId: VerificationPolicyId;
  nonce: string;
  state: EscrowState;
  txHashCreate?: string;
  txHashFund?: string;
  txHashSettle?: string;
}

/**
 * Evidence Envelope
 */
export interface EvidenceEnvelope {
  taskId: string;
  evidenceId: string;
  outputHash: string; // SHA-256 hash of result payload
  artifactUri?: string; // Content-addressed pointer (e.g. sha256:... or ipfs://)
  providerSignature: string; // Signature from provider key
  rawPayload?: unknown; // The actual computed result
  submittedAt: number;
  proofType: 'hash' | 'recompute' | 'multisig';
  proofVersion: string;
}

/**
 * Verifier Attestation
 */
export interface VerifierAttestation {
  taskId: string;
  verifierAddress: string;
  decision: VerificationDecision;
  decisionNonce: string;
  evidenceHash: string;
  signature: string;
  timestamp: number;
}

/**
 * Dispute Record
 */
export interface DisputeRecord {
  taskId: string;
  openedBy: string;
  reasonCode: string;
  evidenceRefs: string[];
  openedAt: number;
  challengeDeadline: number;
  resolution?: 'RELEASED' | 'REFUNDED';
  verifierAttestations: VerifierAttestation[];
}

/**
 * Registered Provider Info
 */
export interface ProviderRecord {
  id: string;
  stellarAddress: string;
  name: string;
  description: string;
  capabilities: string[];
  priceStroops: string;
  slaSeconds: number;
  reputationScore: number;
  totalCompleted: number;
  totalFaulted: number;
  active: boolean;
}

/**
 * Audit / Dashboard Event
 */
export interface TaskEvent {
  id: string;
  taskId: string;
  eventType:
    | 'TASK_CREATED'
    | 'ESCROW_FUNDED'
    | 'WORK_STARTED'
    | 'PROOF_SUBMITTED'
    | 'VERIFICATION_PASSED'
    | 'VERIFICATION_FAILED'
    | 'DISPUTE_OPENED'
    | 'DISPUTE_RESOLVED'
    | 'ESCROW_RELEASED'
    | 'ESCROW_REFUNDED'
    | 'ESCROW_EXPIRED';
  actor: string;
  payload: Record<string, unknown>;
  txHash?: string;
  timestamp: number;
}

/**
 * Quote Request & Response
 */
export interface QuoteRequest {
  buyerAddress: string;
  serviceId: string;
  inputPayload: unknown;
  customDeadlineSeconds?: number;
  verificationPolicyId?: VerificationPolicyId;
}

export interface QuoteResponse {
  serviceId: string;
  providerAddress: string;
  inputHash: string;
  amount: string;
  asset: string;
  deadlineSeconds: number;
  verificationPolicyId: VerificationPolicyId;
  quoteExpiry: number;
  quoteSignature?: string;
}
