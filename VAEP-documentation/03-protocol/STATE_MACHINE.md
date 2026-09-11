# Escrow State Machine

```text
CREATED
  | fund
  v
FUNDED
  | start
  v
IN_PROGRESS
  | submit_proof
  v
PROOF_SUBMITTED
  | verify_success
  v
VERIFIED ----------> RELEASED
  |
  +--> verify_failure --> REFUNDED

PROOF_SUBMITTED --> DISPUTED --> VERIFYING --> RELEASED
                                      |
                                      +-----> REFUNDED

FUNDED / IN_PROGRESS / PROOF_SUBMITTED --deadline--> EXPIRED --> REFUNDED
```

## State transition rules
- `CREATED -> FUNDED`: only if payment is received for the exact task.
- `FUNDED -> IN_PROGRESS`: provider may acknowledge start; this transition is optional for the minimal implementation.
- `IN_PROGRESS -> PROOF_SUBMITTED`: provider submits valid evidence envelope before deadline.
- `PROOF_SUBMITTED -> VERIFIED`: selected verification policy returns an approval.
- `PROOF_SUBMITTED -> REFUNDED`: selected policy rejects evidence and no dispute window remains, or a deterministic failure condition applies.
- `ANY_ACTIVE -> EXPIRED`: deadline passes without valid settlement.
- `DISPUTED -> VERIFYING`: challenge opens a verifier process.
- `VERIFYING -> RELEASED/REFUNDED`: quorum or deterministic dispute rule is satisfied.

## Invalid transitions
The contract must reject any caller attempting to jump directly from `FUNDED`, `IN_PROGRESS`, or `PROOF_SUBMITTED` to `RELEASED` without the required proof/verification authorization path.
