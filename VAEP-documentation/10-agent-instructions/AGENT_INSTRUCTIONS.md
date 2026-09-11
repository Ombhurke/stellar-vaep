# IDE AGENT — MASTER BUILD INSTRUCTIONS

## Role
You are the implementation agent for VAEP. Build the system described in this documentation folder. The human will review architecture and use the project as a competition demo.

## Absolute rules
1. Read every file in this documentation folder before writing implementation code.
2. Treat the documentation as the protocol contract.
3. Do not invent missing competition requirements.
4. Do not replace Soroban escrow with a backend database mock.
5. Do not let the frontend decide settlement.
6. Do not claim hashes prove semantic correctness.
7. Do not expose private keys/secrets.
8. Use Stellar testnet unless the competition explicitly requires another network.
9. Prefer official Stellar documentation and current SDKs over stale tutorials.
10. Pin/package-lock dependencies.
11. Add tests as functionality is added.
12. When a design decision changes protocol semantics, update the documentation file first, then code.

## Implementation order
### Phase 1 — Repository foundation
Create a monorepo or clearly separated apps/packages:
- `contracts/` — Soroban Rust contract(s)
- `services/` — gateway, task, escrow manager, verifier
- `provider/` — demo MCP provider adapter/server
- `web/` — custom dashboard
- `packages/shared/` — schemas, canonical hashing, types
- `scripts/` — setup/deploy/testnet utilities
- `docs/` — this documentation

### Phase 2 — Contract core
Implement task escrow state machine and events.
Implement:
- create
- fund
- submit commitment
- approve/reject
- dispute
- resolve
- expire/refund
- release

Start with one supported asset and deterministic verification to minimize scope.

### Phase 3 — Deterministic verification
Build a service whose verification can be reproduced locally. Example: canonical input + deterministic transformation -> expected output hash.

### Phase 4 — MCP adapter
Create a provider exposing one or more useful tools. Keep transport-specific logic isolated behind an adapter.

### Phase 5 — Provider disappearance / timeout
Make the timeout path fully demonstrable and test it near the deadline boundary.

### Phase 6 — 2-of-3 verifier path
Add three verifier identities and quorum logic. Keep verifier logic simple and explainable.

### Phase 7 — Frontend
Build a minimal competition dashboard around actual events and transaction hashes.

### Phase 8 — Hardening
Run unit, contract, integration, and E2E tests. Add security tests for replay, authorization, wrong task IDs, and invalid state transitions.

## Stellar integration guidance
Current Stellar documentation supports agentic payment protocols including x402 and MPP. Do not implement a new generic payment protocol unless the task explicitly requires it. Use existing payment infrastructure where it reduces complexity, while keeping VAEP's escrow/verification semantics distinct.

Current Stellar smart-wallet/contract-account patterns include spend limits, allow lists, policy signers, time rules, session keys, and external policy contracts. Use these only where they improve VAEP's security without making the competition build fragile.

Use transaction simulation during development when useful to inspect required authorization, resource usage, events, state changes, and failures before submitting transactions.

## Definition of done
The implementation is complete when:
- A real Stellar testnet escrow is created.
- A real provider service is called.
- At least one result is successfully verified and paid.
- At least one invalid result is rejected/refunded.
- At least one timeout causes a refund.
- The dashboard reads real contract state/events.
- Tests cover the critical invalid paths.
- README contains exact setup/run/deploy/demo commands.
- No secrets are committed.

## When blocked
Do not silently work around a missing requirement. Record the blocker in `docs/DECISIONS_AND_BLOCKERS.md`, explain the assumption, and choose the smallest reversible implementation.
