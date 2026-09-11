import { computeCanonicalHash, EvidenceEnvelope } from '@vaep/shared';

let isMaliciousMode = false;

export function setMaliciousMode(enabled: boolean) {
  isMaliciousMode = enabled;
}

export function getMaliciousMode(): boolean {
  return isMaliciousMode;
}

export function executeDeterministicTask(
  taskId: string,
  input: { text: string; algorithm: string }
): { result: Record<string, unknown>; outputHash: string; evidenceEnvelope: EvidenceEnvelope } {
  const words = input.text.trim().split(/\s+/).filter(Boolean);
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

  // If in malicious mode, corrupt the result to test negative verification path
  const finalWordCount = isMaliciousMode ? words.length + 999 : words.length;

  const result = {
    algorithm: input.algorithm,
    metrics: {
      characterCount: input.text.length,
      wordCount: finalWordCount,
      sentimentPolarity: sentiment,
      score: rawSentiment,
    },
    serviceVersion: '1.0.0',
    status: 'COMPLETED',
  };

  const outputHash = computeCanonicalHash(result);

  const evidenceEnvelope: EvidenceEnvelope = {
    taskId,
    evidenceId: `ev-${Date.now()}`,
    outputHash,
    artifactUri: `cas://${outputHash}`,
    providerSignature: `sig_${outputHash.slice(0, 16)}`,
    rawPayload: result,
    submittedAt: Math.floor(Date.now() / 1000),
    proofType: 'recompute',
    proofVersion: '1.0',
  };

  return { result, outputHash, evidenceEnvelope };
}
