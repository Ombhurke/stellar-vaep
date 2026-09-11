import {
  Task,
  EvidenceEnvelope,
  VerificationDecision,
  VerifierAttestation,
  computeCanonicalHash,
} from '@vaep/shared';
import { db } from './supabase.js';

export interface VerificationResult {
  decision: VerificationDecision;
  policyUsed: string;
  expectedHash?: string;
  submittedHash: string;
  hashMatch: boolean;
  reason: string;
  attestations: VerifierAttestation[];
}

export class VerificationEngine {
  /**
   * Deterministically recomputes the expected result for sentiment-v1
   */
  private recomputeDeterministicResult(inputPayload: any): Record<string, unknown> {
    const text: string = inputPayload?.text || '';
    const words = text.trim().split(/\s+/).filter(Boolean);
    const positiveWords = ['stellar', 'soroban', 'secure', 'verifiable', 'fast', 'trust', 'good', 'great', 'excellent'];
    const negativeWords = ['bad', 'fail', 'fraud', 'corrupt', 'slow', 'vulnerable', 'risk', 'bug'];

    let positiveScore = 0;
    let negativeScore = 0;

    for (const w of words) {
      const clean = w.toLowerCase().replace(/[^a-z]/g, '');
      if (positiveWords.includes(clean)) positiveScore++;
      if (negativeWords.includes(clean)) negativeScore++;
    }

    const rawSentiment = positiveScore - negativeScore;
    const sentiment = rawSentiment > 0 ? 'POSITIVE' : rawSentiment < 0 ? 'NEGATIVE' : 'NEUTRAL';

    return {
      algorithm: inputPayload?.algorithm || 'sentiment-v1',
      metrics: {
        characterCount: text.length,
        wordCount: words.length,
        sentimentPolarity: sentiment,
        score: rawSentiment,
      },
      serviceVersion: '1.0.0',
      status: 'COMPLETED',
    };
  }

  /**
   * Evaluates evidence against the task's verification policy
   */
  async verify(
    task: Task,
    evidence: EvidenceEnvelope,
    inputPayload: unknown
  ): Promise<VerificationResult> {
    const policy = task.verificationPolicyId;
    const now = Math.floor(Date.now() / 1000);

    // Check timeout deadline
    if (now > task.deadline) {
      return {
        decision: 'REJECT',
        policyUsed: 'timeout-refund-v1',
        submittedHash: evidence.outputHash,
        hashMatch: false,
        reason: `Task deadline (${new Date(task.deadline * 1000).toISOString()}) has elapsed before valid verification.`,
        attestations: [],
      };
    }

    if (policy === 'deterministic-v1') {
      const expectedOutput = this.recomputeDeterministicResult(inputPayload);
      const expectedHash = computeCanonicalHash(expectedOutput);
      const hashMatch = expectedHash.toLowerCase() === evidence.outputHash.toLowerCase();

      const decision: VerificationDecision = hashMatch ? 'APPROVE' : 'REJECT';
      const attestation: VerifierAttestation = {
        taskId: task.taskId,
        verifierAddress: 'GVERIFIER_NODE_1_CANONICAL_AUDIT_STUB',
        decision,
        decisionNonce: `nonce-${Date.now()}`,
        evidenceHash: evidence.outputHash,
        signature: `sig_${decision.toLowerCase()}_${Date.now()}`,
        timestamp: now,
      };

      await db.saveAttestation(attestation);

      return {
        decision,
        policyUsed: 'deterministic-v1',
        expectedHash,
        submittedHash: evidence.outputHash,
        hashMatch,
        reason: hashMatch
          ? 'Canonical RFC-8785 recomputed output hash strictly matched evidence commitment.'
          : `Hash mismatch! Recomputed hash: ${expectedHash.slice(0, 16)}... != Submitted hash: ${evidence.outputHash.slice(0, 16)}...`,
        attestations: [attestation],
      };
    }

    if (policy === 'quorum-2-of-3-v1') {
      // Recompute baseline
      const expectedOutput = this.recomputeDeterministicResult(inputPayload);
      const expectedHash = computeCanonicalHash(expectedOutput);
      const hashMatch = expectedHash.toLowerCase() === evidence.outputHash.toLowerCase();

      // Node 1: strict hash comparator
      const node1Vote: VerificationDecision = hashMatch ? 'APPROVE' : 'REJECT';
      // Node 2: schema and range validator
      const raw = evidence.rawPayload as any;
      const node2Vote: VerificationDecision =
        raw?.metrics?.characterCount >= 0 && raw?.status === 'COMPLETED' ? 'APPROVE' : 'REJECT';
      // Node 3: consensus check
      const node3Vote: VerificationDecision = hashMatch ? 'APPROVE' : 'REJECT';

      const attestations: VerifierAttestation[] = [
        {
          taskId: task.taskId,
          verifierAddress: 'GVERIFIER_NODE_1_PRIMARY',
          decision: node1Vote,
          decisionNonce: `nonce-n1-${Date.now()}`,
          evidenceHash: evidence.outputHash,
          signature: `sig_v1_${node1Vote}`,
          timestamp: now,
        },
        {
          taskId: task.taskId,
          verifierAddress: 'GVERIFIER_NODE_2_SECONDARY',
          decision: node2Vote,
          decisionNonce: `nonce-n2-${Date.now()}`,
          evidenceHash: evidence.outputHash,
          signature: `sig_v2_${node2Vote}`,
          timestamp: now,
        },
        {
          taskId: task.taskId,
          verifierAddress: 'GVERIFIER_NODE_3_TERTIARY',
          decision: node3Vote,
          decisionNonce: `nonce-n3-${Date.now()}`,
          evidenceHash: evidence.outputHash,
          signature: `sig_v3_${node3Vote}`,
          timestamp: now,
        },
      ];

      for (const att of attestations) {
        await db.saveAttestation(att);
      }

      const approveCount = attestations.filter((a) => a.decision === 'APPROVE').length;
      const decision: VerificationDecision = approveCount >= 2 ? 'APPROVE' : 'REJECT';

      return {
        decision,
        policyUsed: 'quorum-2-of-3-v1',
        expectedHash,
        submittedHash: evidence.outputHash,
        hashMatch,
        reason: `2-of-3 Quorum reached: ${approveCount}/3 verifiers approved.`,
        attestations,
      };
    }

    // Default fallback: reject
    return {
      decision: 'REJECT',
      policyUsed: policy,
      submittedHash: evidence.outputHash,
      hashMatch: false,
      reason: `Unsupported verification policy: ${policy}`,
      attestations: [],
    };
  }
}

export const verifierEngine = new VerificationEngine();
