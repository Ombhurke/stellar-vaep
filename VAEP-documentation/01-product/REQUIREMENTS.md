# Product Requirements

## Functional requirements
FR-01 — A buyer agent can discover or select a provider/service.
FR-02 — A buyer agent can create a task proposal containing service, price, deadline, and verification policy.
FR-03 — A provider can accept or reject a proposal.
FR-04 — The buyer can fund escrow with a supported token.
FR-05 — The escrow contract binds the payment to a unique task ID and task commitment.
FR-06 — The provider can submit evidence for a funded task.
FR-07 — A verification path can approve or reject the evidence.
FR-08 — The contract can release funds after successful verification.
FR-09 — The contract can refund funds after failure or expiry.
FR-10 — A buyer or provider can open a dispute within the allowed window.
FR-11 — A dispute can be resolved by a configured verifier policy.
FR-12 — Provider metadata and reputation can be recorded off-chain and anchored on-chain where appropriate.
FR-13 — The dashboard can display every escrow state transition and evidence reference.
FR-14 — The system can use Stellar testnet for the competition demonstration.

## Security requirements
SEC-01 — No client-controlled parameter may bypass escrow state validation.
SEC-02 — Proof submissions must be bound to task ID, nonce/version, input commitment, and deadline.
SEC-03 — A proof for one task must not be replayable for another task.
SEC-04 — Provider disappearance must not permanently lock buyer funds.
SEC-05 — A compromised or unavailable single verifier must not automatically own the funds where multi-verifier policy is selected.
SEC-06 — Contract authorization must follow least privilege.
SEC-07 — High-value administrative actions must have stronger authorization than ordinary task actions.

## Engineering requirements
ENG-01 — All protocol state transitions must be documented before implementation.
ENG-02 — Smart contracts must have unit and negative-path tests.
ENG-03 — Off-chain services must validate all untrusted inputs.
ENG-04 — The frontend must never be the source of truth for settlement state.
ENG-05 — All external dependencies must be version-pinned where practical.
ENG-06 — Secrets must be stored only in environment/secret-management mechanisms, never committed.

## Competition requirements
This section is intentionally pending the exact minimum requirements supplied by the competition organizer/user. Do not invent missing rules. When the exact criteria are available, add each requirement as `COMP-001`, `COMP-002`, etc., with evidence and implementation location.
