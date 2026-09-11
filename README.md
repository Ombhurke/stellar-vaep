# Verifiable Agent Escrow Protocol (VAEP) on Stellar / Soroban

> **A programmable escrow protocol that enables autonomous AI agents to purchase Model Context Protocol (MCP) services with cryptographic verification and deterministic Soroban settlement.**

---

## ⚡ Core Principle
Payment alone proves money moved — it **does not** prove the purchased AI task was completed correctly. 

VAEP creates a task-scoped escrow agreement on Stellar/Soroban before work begins:
1. **Agent Commitment**: Buyer deposits funds into a Soroban contract bound to canonical input hashes (`RFC 8785`), SLA deadlines, and verification policies.
2. **Deterministic Execution**: An MCP provider executes the requested tool and submits an evidence envelope with computed output hashes.
3. **Cryptographic Verification**: Independent verifiers evaluate the evidence against declared policy rules (`deterministic-v1`, `quorum-2-of-3-v1`, or `timeout-refund-v1`).
4. **On-Chain Settlement**: The Soroban smart contract releases payment to the provider or refunds the buyer without relying on frontend or centralized decisions.

---

## 🏗️ Architecture & Monorepo Layout

```text
Stellar/
├── packages/
│   └── shared/          # RFC 8785 Canonical JSON Hasher, Zod schemas, TypeScript types
├── contracts/
│   └── escrow/          # Rust Soroban smart contract (escrow state machine)
├── services/
│   └── gateway/         # Fastify API, Escrow manager, Verification engine, Supabase adapter
├── provider/
│   └── mcp-server/      # Deterministic MCP provider server (@modelcontextprotocol/sdk)
├── web/                 # React 19 + Vite dashboard (cyber-fintech dark UI, live state machine)
├── supabase/
│   └── migrations/      # PostgreSQL / Supabase schema & Realtime setup
├── scripts/             # Testnet faucet funding, key generator, and E2E test runner
└── VAEP-documentation/  # Protocol architecture, security threat model, and specifications
```

---

## 🚀 Operator Quickstart Guide

### 1. Install Dependencies
```bash
# Install root monorepo dependencies
pnpm install
```

### 2. Environment Setup
```bash
# Copy template and configure variables
cp .env.example .env
```
*(Optional)* Add your `SUPABASE_URL` and `SUPABASE_ANON_KEY` to enable cloud persistence and real-time streams. If omitted, the gateway automatically uses the in-memory fallback for local offline execution.

### 3. Generate & Fund Stellar Testnet Accounts
```bash
# Generates keypairs for Buyer, Provider, and 3 Verifiers, and funds them via Friendbot
pnpm run keys:generate
```

### 4. Smart Contract Tests & Compilation (Rust / Soroban)
```bash
# Run Soroban unit tests (state transitions, authorization, timeouts)
cargo test --manifest-path contracts/escrow/Cargo.toml

# Build the WebAssembly contract binary
soroban contract build --manifest-path contracts/escrow/Cargo.toml
```

### 5. Deploy Contract to Stellar Testnet
```bash
stellar contract deploy \
  --wasm contracts/escrow/target/wasm32-unknown-unknown/release/vaep_escrow.wasm \
  --source default \
  --network testnet
```

### 6. Start Services

You can launch all components concurrently:
```bash
# Start Gateway (Port 4000), MCP Provider (Port 4001), and Dashboard (Port 3000)
pnpm run dev:all
```

Or run individual services:
```bash
# Terminal 1: Start Gateway API
pnpm run dev:gateway

# Terminal 2: Start MCP Provider Server
pnpm run dev:provider

# Terminal 3: Start Web Dashboard
pnpm run dev:web
```

### 7. Run Automated End-to-End Test Suite
```bash
# Runs Scenarios 1 (Success), 2 (Malicious Attack), 3 (Timeout), and 4 (2-of-3 Quorum)
pnpm run demo:e2e
```

### 8. Interactive Competition Demo
Open your browser at **`http://localhost:3000`** to view the live dashboard:
- **Scenario 1**: Watch the state machine transition `CREATED -> FUNDED -> IN_PROGRESS -> PROOF_SUBMITTED -> RELEASED` with verifiable transaction links.
- **Scenario 2**: Test a malicious provider submitting tampered output; verify that the hash mismatch triggers an immediate on-chain refund to the buyer.
- **Scenario 3**: Observe deadline timeout enforcement when a provider disappears.
- **Scenario 4**: Run a 2-of-3 multi-verifier quorum resolution with independent node signatures.

---

## 🛡️ Security Posture & Non-Negotiables
- **No Database Balances**: Escrow balances live on-chain in Soroban.
- **RFC 8785 Canonical Hashing**: Object keys are deterministically sorted prior to hashing to prevent serialization divergence.
- **Authorization Invariants**: Providers cannot self-approve; contract functions require `buyer.require_auth()` for funding and `verifier.require_auth()` for settlement.
- **Timeout Safety**: Escrow capital is never locked indefinitely; expired tasks are refundable.
