import React from 'react';
import { Check, AlertCircle, Clock, CheckCircle2, XCircle } from 'lucide-react';

interface StateMachineViewerProps {
  currentState: string;
}

const STEPS = [
  { id: 'CREATED', label: '1. Created' },
  { id: 'FUNDED', label: '2. Funded' },
  { id: 'IN_PROGRESS', label: '3. Executing' },
  { id: 'PROOF_SUBMITTED', label: '4. Evidence Bound' },
  { id: 'SETTLED', label: '5. Settlement' },
];

export const StateMachineViewer: React.FC<StateMachineViewerProps> = ({ currentState }) => {
  const getStepStatus = (index: number) => {
    const stateOrder = ['CREATED', 'FUNDED', 'IN_PROGRESS', 'PROOF_SUBMITTED'];
    const currentIndex = stateOrder.indexOf(currentState);

    if (currentState === 'RELEASED' || currentState === 'REFUNDED' || currentState === 'EXPIRED') {
      if (index < 4) return 'completed';
      if (index === 4) return currentState === 'RELEASED' ? 'completed' : 'failed';
    }

    if (currentIndex === -1) return 'pending';
    if (index < currentIndex) return 'completed';
    if (index === currentIndex) return 'active';
    return 'pending';
  };

  return (
    <div className="glass-card" style={{ marginBottom: '24px' }}>
      <div className="section-header" style={{ marginBottom: '12px' }}>
        <div className="section-title">
          <Clock size={18} color="#818cf8" />
          <span>Soroban Escrow Protocol State Machine</span>
        </div>
        <div className="badge" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Current State: <strong style={{ color: currentState === 'RELEASED' ? '#10b981' : currentState === 'REFUNDED' ? '#f43f5e' : '#38bdf8' }}>{currentState}</strong>
        </div>
      </div>

      <div className="flow-container">
        {STEPS.map((step, idx) => {
          const status = getStepStatus(idx);
          return (
            <React.Fragment key={step.id}>
              <div className={`flow-step ${status}`}>
                <div className="flow-step-node">
                  {status === 'completed' ? (
                    <Check size={18} />
                  ) : status === 'failed' ? (
                    <XCircle size={18} />
                  ) : status === 'active' ? (
                    <span className="badge-live" style={{ width: 10, height: 10 }}></span>
                  ) : (
                    idx + 1
                  )}
                </div>
                <div className="flow-step-label">
                  {idx === 4 && currentState === 'RELEASED'
                    ? 'Released (Paid)'
                    : idx === 4 && currentState === 'REFUNDED'
                    ? 'Refunded'
                    : step.label}
                </div>
              </div>
              {idx < STEPS.length - 1 && <div className="flow-divider"></div>}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
