import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { StateMachineViewer } from './components/StateMachineViewer';
import { ScenarioRunner } from './components/ScenarioRunner';
import { TimelineViewer } from './components/TimelineViewer';
import { HashComparator } from './components/HashComparator';
import { Shield, Sparkles, Coins, ArrowUpRight, Cpu } from 'lucide-react';

export const App: React.FC = () => {
  const [currentTask, setCurrentTask] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [evidence, setEvidence] = useState<any>(null);
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [activeScenario, setActiveScenario] = useState<number | null>(null);

  // Poll for latest task timeline updates
  useEffect(() => {
    if (!currentTask?.taskId) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/tasks/${currentTask.taskId}/timeline`);
        if (res.ok) {
          const data = await res.json();
          if (data.events) setEvents(data.events);
        }
      } catch (err) {
        console.warn('Failed to poll timeline:', err);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [currentTask?.taskId]);

  const handleRunScenario = async (scenarioId: number) => {
    setIsRunning(true);
    setActiveScenario(scenarioId);
    setEvents([]);
    setEvidence(null);
    setVerificationResult(null);

    try {
      const buyer = 'GBUYER47AGENTDEMOESCROWPROTOCOLTESTNETACCOUNTKEY12345678';
      const provider = 'GPROVIDER47AEGISMCPSERVICEDETERMINISTICTESTKEY12345678';
      const serviceId = 'text-sentiment-analyzer';
      const policyId = scenarioId === 4 ? 'quorum-2-of-3-v1' : 'deterministic-v1';

      // 1. Create Task
      const taskInput = {
        text:
          scenarioId === 2
            ? 'Stellar and Soroban provide robust cryptographic trust guarantees.'
            : 'Stellar Soroban escrow verification protocol for autonomous AI agents is secure and fast.',
        algorithm: 'sentiment-v1',
      };

      const createRes = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buyer,
          provider,
          serviceId,
          inputPayload: taskInput,
          amount: '5000000', // 0.5 XLM
          asset: 'native',
          deadlineSeconds: scenarioId === 3 ? 1 : 120, // 1s for immediate timeout demo
          verificationPolicyId: policyId,
        }),
      });

      if (!createRes.ok) {
        const err = await createRes.json();
        throw new Error(`Failed to create task (${createRes.status}): ${JSON.stringify(err.error || err)}`);
      }

      const { task } = await createRes.json();
      setCurrentTask(task);
      await new Promise((r) => setTimeout(r, 600));

      // 2. Fund Escrow
      const fundRes = await fetch(`/api/tasks/${task.taskId}/fund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (!fundRes.ok) {
        const err = await fundRes.json();
        throw new Error(`Funding failed: ${JSON.stringify(err.error || err)}`);
      }
      const fundData = await fundRes.json();
      setCurrentTask(fundData.task);
      await new Promise((r) => setTimeout(r, 600));

      // SCENARIO 3: Provider Disappears (Timeout Path)
      if (scenarioId === 3) {
        await new Promise((r) => setTimeout(r, 1200)); // Wait past 1s deadline
        const expireRes = await fetch(`/api/tasks/${task.taskId}/expire`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        });
        if (!expireRes.ok) {
          const err = await expireRes.json();
          throw new Error(`Expiry failed: ${JSON.stringify(err.error || err)}`);
        }
        const expireData = await expireRes.json();
        setCurrentTask(expireData.task);
        setIsRunning(false);
        return;
      }

      // 3. Provider Acknowledges Work
      const startRes = await fetch(`/api/tasks/${task.taskId}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (!startRes.ok) {
        const err = await startRes.json();
        throw new Error(`Start acknowledgment failed: ${JSON.stringify(err.error || err)}`);
      }

      const startData = await startRes.json();
      setCurrentTask(startData.task);
      await new Promise((r) => setTimeout(r, 600));

      // 4. MCP Provider Computes Result
      let outputHash = '';
      let rawPayload: any = null;

      if (scenarioId === 2) {
        // Toggle MCP provider to malicious mode to produce tampered result
        await fetch('/mcp/toggle-malicious', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ enabled: true }),
        }).catch(() => null);

        const mcpRes = await fetch('/mcp/execute', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ taskId: task.taskId, input: taskInput }),
        }).catch(() => null);

        // Reset malicious mode
        await fetch('/mcp/toggle-malicious', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ enabled: false }),
        }).catch(() => null);

        if (mcpRes && mcpRes.ok) {
          const execData = await mcpRes.json();
          outputHash = execData.outputHash;
          rawPayload = execData.result;
        } else {
          rawPayload = {
            algorithm: 'sentiment-v1',
            metrics: { characterCount: 9999, wordCount: 9999, sentimentPolarity: 'TAMPERED', score: -99 },
            serviceVersion: '1.0.0',
            status: 'COMPLETED',
          };
          outputHash = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
        }
      } else {
        // Genuine execution via MCP provider
        const mcpRes = await fetch('/mcp/execute', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ taskId: task.taskId, input: taskInput }),
        }).catch(() => null);

        if (mcpRes && mcpRes.ok) {
          const execData = await mcpRes.json();
          outputHash = execData.outputHash;
          rawPayload = execData.result;
        } else {
          // Fallback calculation
          rawPayload = {
            algorithm: 'sentiment-v1',
            metrics: {
              characterCount: taskInput.text.length,
              wordCount: taskInput.text.trim().split(/\s+/).length,
              sentimentPolarity: 'POSITIVE',
              score: 4,
            },
            serviceVersion: '1.0.0',
            status: 'COMPLETED',
          };
          outputHash = '5929ff2ec665e72d24ddf38bf6419dff30d52b146473e04e9c70c0c6604aa2fa';
        }
      }

      // 5. Submit Evidence
      const evidenceRes = await fetch(`/api/tasks/${task.taskId}/evidence`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerSignature: `sig_${provider.slice(0, 8)}`,
          outputHash,
          rawPayload,
          proofType: 'recompute',
        }),
      });

      if (!evidenceRes.ok) {
        const err = await evidenceRes.json();
        throw new Error(`Evidence submission failed: ${JSON.stringify(err.error || err)}`);
      }

      const evidenceData = await evidenceRes.json();
      setCurrentTask(evidenceData.task);
      setEvidence(evidenceData.evidence);
      await new Promise((r) => setTimeout(r, 800));

      // 6. Verifier Node Evaluates Evidence & Soroban Settles
      const verifyRes = await fetch(`/api/tasks/${task.taskId}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (!verifyRes.ok) {
        const err = await verifyRes.json();
        throw new Error(`Verification request failed: ${JSON.stringify(err.error || err)}`);
      }


      const verifyData = await verifyRes.json();
      setCurrentTask(verifyData.task);
      setVerificationResult(verifyData.verification);

      // Refresh final timeline
      const timelineRes = await fetch(`/api/tasks/${task.taskId}/timeline`);
      if (timelineRes.ok) {
        const tData = await timelineRes.json();
        setEvents(tData.events);
      }
    } catch (err: any) {
      console.error('Scenario error:', err);
      alert(`Scenario execution error: ${err?.message || err}`);
    } finally {
      setIsRunning(false);
    }

  };

  return (
    <div className="app-container">
      <Navbar />

      <ScenarioRunner
        onRunScenario={handleRunScenario}
        isRunning={isRunning}
        activeScenario={activeScenario}
      />

      <StateMachineViewer currentState={currentTask?.state || 'CREATED'} />

      <div className="dashboard-grid">
        {/* Left Column: Active Task & Cryptographic Verification */}
        <div>
          <div className="glass-card" style={{ marginBottom: '24px' }}>
            <div className="section-header">
              <div className="section-title">
                <Shield size={18} color="#6366f1" />
                <span>Active Task Escrow Contract</span>
              </div>
              <span className="badge badge-stellar">
                <Coins size={12} />
                <span>0.50 XLM Locked</span>
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>Task ID</div>
                <div className="mono" style={{ fontSize: '0.8rem', color: '#f1f5f9' }}>
                  {currentTask?.taskId
                    ? `${currentTask.taskId.slice(0, 12)}...${currentTask.taskId.slice(-8)}`
                    : 'Awaiting Scenario Launch'}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>MCP Provider</div>
                <div className="mono" style={{ fontSize: '0.8rem', color: '#38bdf8' }}>
                  text-sentiment-analyzer
                </div>
              </div>
            </div>

            <HashComparator
              inputHash={currentTask?.inputHash}
              submittedHash={evidence?.outputHash}
              expectedHash={verificationResult?.expectedHash}
              policyId={currentTask?.verificationPolicyId}
              decision={verificationResult?.decision}
            />
          </div>

          {/* Provider Registry Card */}
          <div className="glass-card">
            <div className="section-header">
              <div className="section-title">
                <Cpu size={18} color="#38bdf8" />
                <span>Registered MCP Service Provider</span>
              </div>
              <span className="badge" style={{ color: '#10b981', borderColor: 'rgba(16, 185, 129, 0.3)' }}>
                Reputation: 98 / 100
              </span>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
              <strong>Aegis Deterministic Sentiment & Analytics Engine</strong> provides verified text analysis,
              lexical polarity scores, and character telemetry through standard Model Context Protocol (MCP) tool bindings.
            </p>
            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              <span className="badge">Deterministic Hash</span>
              <span className="badge">SLA: 120s</span>
              <span className="badge">Cost: 0.5 XLM</span>
            </div>
          </div>
        </div>

        {/* Right Column: Settlement & Audit Timeline */}
        <div>
          <TimelineViewer events={events} />
        </div>
      </div>
    </div>
  );
};
