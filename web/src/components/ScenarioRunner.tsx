import React, { useState } from 'react';
import { Play, AlertTriangle, Clock, Users, Loader2 } from 'lucide-react';

interface ScenarioRunnerProps {
  onRunScenario: (scenarioId: number) => Promise<void>;
  isRunning: boolean;
  activeScenario: number | null;
}

export const ScenarioRunner: React.FC<ScenarioRunnerProps> = ({
  onRunScenario,
  isRunning,
  activeScenario,
}) => {
  const [selectedScenario, setSelectedScenario] = useState<number | null>(null);

  const handleRun = async (id: number) => {
    setSelectedScenario(id);
    await onRunScenario(id);
  };

  return (
    <div className="scenario-banner">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f8fafc' }}>
            Interactive Competition Scenarios
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Execute end-to-end verifiable agent payment workflows with live Soroban testnet simulation.
          </p>
        </div>
        {isRunning && (
          <div className="badge badge-stellar" style={{ animation: 'pulse 1.5s infinite' }}>
            <Loader2 size={14} className="spin" />
            <span>Executing Workflow...</span>
          </div>
        )}
      </div>

      <div className="scenario-grid">
        <button
          className={`btn-scenario ${selectedScenario === 1 ? 'active' : ''}`}
          onClick={() => handleRun(1)}
          disabled={isRunning}
        >
          <div className="btn-scenario-title">
            <span>Scenario 1: Happy Path Release</span>
            <Play size={16} color="#10b981" />
          </div>
          <div className="btn-scenario-desc">
            Buyer creates escrow. Deterministic MCP tool computes sentiment. Verifier confirms canonical RFC-8785 hash match. Soroban releases funds.
          </div>
        </button>

        <button
          className={`btn-scenario ${selectedScenario === 2 ? 'active' : ''}`}
          onClick={() => handleRun(2)}
          disabled={isRunning}
        >
          <div className="btn-scenario-title">
            <span>Scenario 2: Malicious Provider Attack</span>
            <AlertTriangle size={16} color="#f43f5e" />
          </div>
          <div className="btn-scenario-desc">
            Provider submits tampered output. Verifier detects hash mismatch and rejects proof. Contract refunds buyer balance.
          </div>
        </button>

        <button
          className={`btn-scenario ${selectedScenario === 3 ? 'active' : ''}`}
          onClick={() => handleRun(3)}
          disabled={isRunning}
        >
          <div className="btn-scenario-title">
            <span>Scenario 3: Provider Disappearance</span>
            <Clock size={16} color="#f59e0b" />
          </div>
          <div className="btn-scenario-desc">
            Provider accepts escrow but never delivers evidence. Deadline timer expires. Contract automatically refunds buyer.
          </div>
        </button>

        <button
          className={`btn-scenario ${selectedScenario === 4 ? 'active' : ''}`}
          onClick={() => handleRun(4)}
          disabled={isRunning}
        >
          <div className="btn-scenario-title">
            <span>Scenario 4: 2-of-3 Verifier Dispute</span>
            <Users size={16} color="#a855f7" />
          </div>
          <div className="btn-scenario-desc">
            Complex task triggers multi-verifier dispute. 3 independent verifier nodes vote, achieving 2-of-3 quorum on-chain.
          </div>
        </button>
      </div>
    </div>
  );
};
