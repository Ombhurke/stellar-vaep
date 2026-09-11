import React from 'react';
import { Fingerprint, CheckCircle, XCircle, ShieldCheck } from 'lucide-react';

interface HashComparatorProps {
  inputHash?: string;
  submittedHash?: string;
  expectedHash?: string;
  policyId?: string;
  decision?: string;
}

export const HashComparator: React.FC<HashComparatorProps> = ({
  inputHash = '0x...',
  submittedHash,
  expectedHash,
  policyId = 'deterministic-v1',
  decision,
}) => {
  const isMatch = submittedHash && expectedHash && submittedHash.toLowerCase() === expectedHash.toLowerCase();

  return (
    <div className="hash-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: 600 }}>
          <Fingerprint size={16} color="#06b6d4" />
          <span>RFC 8785 Cryptographic Evidence Binding</span>
        </div>
        <span className="badge" style={{ fontSize: '0.7rem' }}>
          Policy: {policyId}
        </span>
      </div>

      <div className="hash-row">
        <span className="hash-label">Canonical Input Commitment:</span>
        <span className="hash-value" title={inputHash}>
          {inputHash.length > 20 ? `${inputHash.slice(0, 10)}...${inputHash.slice(-10)}` : inputHash}
        </span>
      </div>

      {submittedHash && (
        <div className="hash-row">
          <span className="hash-label">Provider Evidence Hash:</span>
          <span className="hash-value" title={submittedHash}>
            {submittedHash.slice(0, 10)}...{submittedHash.slice(-10)}
          </span>
        </div>
      )}

      {expectedHash && (
        <div className="hash-row">
          <span className="hash-label">Verifier Recomputed Hash:</span>
          <span className="hash-value" title={expectedHash}>
            {expectedHash.slice(0, 10)}...{expectedHash.slice(-10)}
          </span>
        </div>
      )}

      {decision && (
        <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-subtle)', paddingTop: '10px' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Verification Verdict:</span>
          <span className={`hash-match-pill ${decision === 'APPROVE' ? 'match-pass' : 'match-fail'}`}>
            {decision === 'APPROVE' ? <CheckCircle size={14} /> : <XCircle size={14} />}
            {decision === 'APPROVE' ? 'VERIFIED (PASS)' : 'REJECTED (FAIL)'}
          </span>
        </div>
      )}
    </div>
  );
};
