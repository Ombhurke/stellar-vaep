# IDE Agent Development Workflow

## Before coding
- Read `README.md`.
- Read `PROJECT_BRIEF.md`.
- Read architecture + protocol + contract + verification + security specs.
- Confirm current Stellar SDK/API syntax from official docs.

## During coding
For each feature:
1. Identify the governing requirement.
2. Identify the governing protocol rule.
3. Implement the smallest testable unit.
4. Add unit/contract/integration tests.
5. Run formatter/linter/type checks.
6. Update docs if behavior changed.

## Git discipline
Prefer small commits such as:
- `feat(contract): add escrow state machine`
- `test(contract): cover expiry and replay`
- `feat(verifier): add deterministic policy`
- `feat(ui): add escrow timeline`

## Error handling
Errors must expose stable machine-readable codes, for example:
- `TASK_NOT_FOUND`
- `INVALID_STATE`
- `DEADLINE_EXPIRED`
- `PROOF_REPLAY`
- `EVIDENCE_MISMATCH`
- `UNAUTHORIZED_VERIFIER`
- `QUORUM_NOT_REACHED`

## Demo safety
Use testnet accounts and clearly labelled demo data. Never use real funds.
