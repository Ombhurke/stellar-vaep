import React from 'react';
import { ShieldCheck, Database, Globe, Cpu } from 'lucide-react';

interface NavbarProps {
  contractId?: string;
  isSupabaseLive?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ contractId, isSupabaseLive = true }) => {
  const shortContract = contractId
    ? `${contractId.slice(0, 6)}...${contractId.slice(-6)}`
    : 'CAEG...ESCROW';

  return (
    <nav className="navbar">
      <div className="nav-brand">
        <div className="nav-logo-badge">
          <ShieldCheck size={24} />
        </div>
        <div>
          <div className="nav-title">VAEP Protocol</div>
          <div className="nav-subtitle">Verifiable Agent Escrow on Stellar</div>
        </div>
      </div>

      <div className="nav-badges">
        <div className="badge badge-stellar">
          <Globe size={13} />
          <span>Stellar Testnet</span>
        </div>

        <div className="badge badge-supabase">
          <Database size={13} />
          <span>Supabase Realtime</span>
          <span className="badge-live"></span>
        </div>

        <div className="badge">
          <Cpu size={13} />
          <span className="mono" title={contractId || 'Soroban Contract'}>
            {shortContract}
          </span>
        </div>
      </div>
    </nav>
  );
};
