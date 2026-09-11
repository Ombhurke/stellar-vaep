# Recommended Technical Stack

## Smart contracts
- Rust
- Soroban SDK (v22+)
- Stellar Testnet (via Horizon & Soroban RPC)

## Backend & Services
- TypeScript / Node.js
- Fastify service framework
- Official Stellar SDK (`@stellar/stellar-sdk`)
- Zod for strict request/response schema validation
- RFC 8785 deterministic canonical JSON serializer for cryptographic hashing

## MCP / Provider
- TypeScript MCP SDK (`@modelcontextprotocol/sdk`)
- Deterministic data transformation & metric analysis tool
- Stdio & SSE transports

## Frontend Dashboard
- React 19 + TypeScript
- Vite
- Custom Vanilla CSS design system (cyber-fintech aesthetic, dark mode, responsive glassmorphism)
- Real-time event streaming (Supabase Realtime / SSE) and Stellar Testnet Explorer deep-links

## Storage & Database
- **Supabase (PostgreSQL)**: Authoritative off-chain workflow state, provider registry, dispute records, and event logs.
- **Supabase Realtime**: Live updates to the dashboard for task transitions and verifier votes.
- **Content-Addressed Storage (CAS) / Supabase Storage**: Off-chain evidence artifact store keyed by SHA-256 hash.
- **On-chain Soroban Storage**: Authoritative financial state machine and cryptographic commitments.

## Observability
- Structured JSON logs.
- Correlation ID = `task_id`.
- Dashboard timeline derived from persisted events, Supabase Realtime, and on-chain transaction reads.

