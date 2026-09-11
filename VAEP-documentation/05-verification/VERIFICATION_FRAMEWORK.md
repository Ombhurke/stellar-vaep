# Verification Framework

## Principle
A cryptographic hash proves integrity/identity of bytes; it does not by itself prove semantic correctness. VAEP therefore treats verification policy as a first-class protocol object.

## Policy types
### 1. Deterministic output verification
Use when the expected answer can be computed deterministically. Example: a data transformation with a known canonical output hash.

### 2. Provider signature + integrity
Useful for trusted providers or attestations where authenticity is the main requirement.

### 3. Multi-verifier quorum
Multiple independent verifiers evaluate the evidence. Example policy: 2-of-3 approval.

### 4. Oracle-backed verification
An oracle may attest to real-world state. The oracle trust assumptions must be explicit and preferably redundant.

### 5. Challenge window
A provisional acceptance enters a challenge period. If no valid challenge is raised, funds release automatically.

### 6. ZK/proof-based verification (stretch goal)
Use only for tasks where a practical proof system exists. The first implementation should not depend on building a general-purpose zero-knowledge prover.

## Recommended competition implementation
Implement three policies:
1. `deterministic-v1` — easiest to verify reliably.
2. `quorum-2-of-3-v1` — demonstrates decentralization/dispute handling.
3. `timeout-refund-v1` — demonstrates liveness and buyer protection.

## Verification result semantics
A verifier must produce one of:
- `APPROVE`
- `REJECT`
- `ABSTAIN`

The policy engine decides how those responses affect settlement.
