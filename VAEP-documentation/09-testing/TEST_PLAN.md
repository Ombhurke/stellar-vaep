# Test Plan

## Unit tests
- Canonical hashing.
- Task schema validation.
- State transition guards.
- Deadline checks.
- Replay detection.
- Evidence binding.
- Quorum calculation.

## Contract tests
Positive and negative tests for every public method.

## Integration tests
- Gateway -> task service.
- Task service -> escrow contract.
- Provider -> evidence API.
- Verifier -> decision submission.
- Indexer -> dashboard.

## End-to-end test cases
E2E-01 successful deterministic task.
E2E-02 invalid result -> refund.
E2E-03 no result -> expiry refund.
E2E-04 duplicated proof -> reject.
E2E-05 wrong task ID -> reject.
E2E-06 unauthorized verifier -> reject.
E2E-07 dispute 2-of-3 approve.
E2E-08 dispute 2-of-3 reject.
E2E-09 repeated settlement call -> idempotent/rejected.
E2E-10 wrong recipient/asset -> reject.

## Acceptance criterion
A full demo scenario passes only when the contract state, observed events, API state, and dashboard display agree.
