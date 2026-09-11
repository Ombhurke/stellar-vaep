# START HERE — IDE BUILD HANDOFF

You are building **VAEP (Verifiable Agent Escrow Protocol)**.

Read this file first, then read `10-agent-instructions/AGENT_INSTRUCTIONS.md`, then all specification files before implementing major features.

## What you are building
A real Stellar/Soroban escrow and verification protocol for autonomous AI agents purchasing MCP services.

The system must demonstrate:

`Agent -> MCP service -> task commitment -> Soroban escrow -> work -> evidence -> verification -> release/refund`

## Hard requirement
Do not turn this into a normal payment demo. The differentiating feature is that a payment is escrowed against a task and settlement depends on verification.

## First working slice
Implement this exact vertical slice first:

1. Provider exposes one deterministic MCP-compatible service.
2. Buyer creates a task with a canonical input hash.
3. Soroban contract creates and funds escrow on Stellar Testnet.
4. Provider executes task.
5. Provider submits result hash/evidence.
6. Deterministic verifier recomputes/validates the expected result.
7. Contract releases payment.
8. Dashboard displays task timeline and on-chain transaction hash.

Then implement failure/timeout and finally 2-of-3 dispute resolution.

## What must be real
- Soroban contract invocation.
- Escrowed testnet funds.
- State transitions.
- Evidence binding.
- Verification decision authorization.
- Release/refund.
- At least one negative test path.

## What may be mocked initially
- Complex AI reasoning.
- Large model inference.
- Real-world oracle feeds.
- Production-grade MCP marketplace discovery.
- ZK proofs.

Mocks must be clearly isolated and replaceable.

## Never accept these shortcuts
- Database balance instead of on-chain escrow.
- Frontend-controlled release.
- `verified=true` from the provider.
- Hard-coded success transaction hash.
- Fake verifier votes that never affect contract state.
- A hash presented as proof of semantic correctness without a verification rule.

## End-state architecture
Use the detailed architecture in `02-architecture/SYSTEM_ARCHITECTURE.md` and the exact state machine in `03-protocol/STATE_MACHINE.md`.

## Required final operator commands
The final README must contain commands for:
- install
- environment setup
- contract test
- contract deploy
- seed/fund testnet accounts
- start backend
- start provider
- start frontend
- run E2E test
- run demo
