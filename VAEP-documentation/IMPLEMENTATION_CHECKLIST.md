# Implementation Checklist

## Foundation
- [x] Monorepo created (pnpm workspaces)
- [x] Docs integrated into repo
- [x] `.gitignore` configured
- [x] `.env.example` created
- [x] CI/test command defined (`pnpm test`, `pnpm run demo:e2e`)

## Soroban
- [x] Contract scaffold (`contracts/escrow/Cargo.toml`)
- [x] Task storage (`DataKey::Task`)
- [x] Escrow creation (`create_escrow`)
- [x] Funding (`fund_escrow`)
- [x] Proof commitment (`submit_proof_commitment`)
- [x] Verification authorization (`approve` / `reject`)
- [x] Release (`release`)
- [x] Refund (`refund`)
- [x] Expiry (`expire`)
- [x] Dispute (`open_dispute`, `resolve_dispute`)
- [x] Events (published for all transitions)
- [x] Negative-path tests (`test_escrow_rejection_path`, `test_escrow_expiry_timeout`)

## Verification
- [x] Canonical hashing module (RFC 8785 in `@vaep/shared`)
- [x] Deterministic verifier (`deterministic-v1`)
- [x] Evidence schema (`EvidenceEnvelope` with Zod)
- [x] Replay protection (Task ID bound to nonce + canonical hash)
- [x] 2-of-3 verifier policy (`quorum-2-of-3-v1`)

## MCP
- [x] Provider adapter (`provider/mcp-server`)
- [x] One deterministic tool (`analyze_text_metrics` / sentiment)
- [x] Quote endpoint/metadata (`/tasks/quote`)
- [x] Task ID propagation
- [x] Evidence return (CAS artifact + SHA-256 envelope)

## Backend
- [x] Supabase schema & migration scripts (`supabase/migrations/001_initial_schema.sql`)
- [x] Supabase client & Realtime subscriber (`services/gateway/src/supabase.ts`)
- [x] Provider registry (`GET /providers`, `POST /providers`)
- [x] Task API (`POST /tasks`, `GET /tasks/:taskId`, `GET /tasks/:taskId/timeline`)
- [x] Escrow manager (`POST /tasks/:taskId/fund`)
- [x] Verification API (`POST /tasks/:taskId/verify`)
- [x] Dispute API (`POST /tasks/:taskId/dispute`, `POST /tasks/:taskId/resolve`)
- [x] Blockchain event/state reader (`services/gateway/src/stellar.ts`)

## Frontend
- [x] Agent/provider view
- [x] Create task flow (Interactive scenario triggers)
- [x] Escrow status (Visual state machine visualizer)
- [x] Verification evidence (Artifact CAS details)
- [x] Verifier votes (2-of-3 quorum attestations)
- [x] Deadline countdown
- [x] Release/refund status (Dynamic status badges & indicators)
- [x] Stellar transaction links (Deep-links to Stellar Expert explorer)

## Security
- [x] No secrets in git (`.gitignore`, `.env.example`)
- [x] Wrong-task tests (E2E invalid task ID check)
- [x] Wrong-asset tests
- [x] Wrong-provider tests
- [x] Replay tests
- [x] Unauthorized-verifier tests
- [x] Expiry tests (Tested in `demo:e2e` scenario 3)
- [x] Double-settlement tests

## Demo
- [x] Success scenario (Scenario 1 verified)
- [x] Bad-result scenario (Scenario 2 verified)
- [x] Provider-timeout scenario (Scenario 3 verified)
- [x] Optional dispute scenario (Scenario 4 verified)
- [x] Demo runner script (`scripts/demo-e2e.ts`)

