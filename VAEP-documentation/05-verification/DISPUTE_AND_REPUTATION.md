# Disputes and Reputation

## Dispute lifecycle
1. Buyer receives provider result.
2. Buyer raises dispute with reason code and evidence reference.
3. Escrow enters `DISPUTED`.
4. Verifiers receive the evidence bundle.
5. Each verifier independently commits a decision.
6. Decisions are revealed/aggregated according to implementation complexity.
7. Quorum determines release or refund.
8. Outcome is recorded against the task and provider history.

## Reputation dimensions
Track separately:
- completion rate
- dispute rate
- verifier agreement rate
- timeout rate
- average latency
- successful value settled

Do not reduce reputation to a single opaque score during the first implementation. Keep raw metrics so the dashboard is explainable.

## Important separation
Reputation may influence provider selection or minimum acceptance thresholds. It must not silently override an escrow contract's explicit verification policy.
