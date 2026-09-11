import React from 'react';
import { History, ExternalLink, ArrowRight, ShieldCheck, UserCheck, Bot, FileCheck } from 'lucide-react';

interface EventItem {
  id: string;
  eventType: string;
  actor: string;
  payload: Record<string, unknown>;
  txHash?: string;
  timestamp: number;
}

interface TimelineViewerProps {
  events: EventItem[];
}

export const TimelineViewer: React.FC<TimelineViewerProps> = ({ events }) => {
  const getActorIcon = (eventType: string) => {
    if (eventType.includes('ESCROW') || eventType.includes('SETTLED')) {
      return <ShieldCheck size={16} color="#818cf8" />;
    }
    if (eventType.includes('VERIFICATION')) {
      return <UserCheck size={16} color="#34d399" />;
    }
    if (eventType.includes('WORK') || eventType.includes('PROOF')) {
      return <Bot size={16} color="#38bdf8" />;
    }
    return <FileCheck size={16} color="#fbbf24" />;
  };

  return (
    <div className="glass-card">
      <div className="section-header">
        <div className="section-title">
          <History size={18} color="#06b6d4" />
          <span>On-Chain Settlement & Audit Timeline</span>
        </div>
        <span className="badge" style={{ fontSize: '0.75rem' }}>
          {events.length} Events Logged
        </span>
      </div>

      {events.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '36px 0', color: 'var(--text-subtle)', fontSize: '0.85rem' }}>
          No protocol transitions recorded yet. Trigger a scenario above to observe live state changes.
        </div>
      ) : (
        <div className="timeline">
          {events.map((evt) => (
            <div className="timeline-item" key={evt.id}>
              <div className="timeline-icon">{getActorIcon(evt.eventType)}</div>
              <div className="timeline-content">
                <div className="timeline-header">
                  <div className="timeline-title">{evt.eventType.replace(/_/g, ' ')}</div>
                  <div className="timeline-time">
                    {new Date(evt.timestamp * 1000).toLocaleTimeString()}
                  </div>
                </div>

                <div className="timeline-actor">
                  <span>Actor: </span>
                  <strong className="mono" style={{ color: '#cbd5e1' }}>
                    {evt.actor.length > 25 ? `${evt.actor.slice(0, 10)}...${evt.actor.slice(-8)}` : evt.actor}
                  </strong>
                </div>

                {evt.txHash && (
                  <div>
                    <a
                      href={`https://stellar.expert/explorer/testnet/tx/${evt.txHash}`}
                      target="_blank"
                      rel="noreferrer"
                      className="explorer-link"
                    >
                      <span>Stellar Tx: {evt.txHash.slice(0, 16)}...</span>
                      <ExternalLink size={12} />
                    </a>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
