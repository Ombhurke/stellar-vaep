# Soroban Escrow Contract Specification

## Contract responsibilities
1. Hold escrow funds.
2. Store the minimum task commitment required for settlement.
3. Enforce task state transitions.
4. Accept authorized verification decisions.
5. Enforce deadlines and refund paths.
6. Prevent replay of evidence/verification decisions.
7. Emit structured events for the dashboard/indexer.

## Proposed interface
```text
create_escrow(task_id, buyer, provider, asset, amount, input_hash, policy_id, deadline, nonce)
fund_escrow(task_id, amount)
acknowledge_start(task_id)
submit_proof_commitment(task_id, evidence_hash, proof_version)
approve(task_id, decision, evidence_hash, decision_nonce, verifier_auth)
reject(task_id, decision, evidence_hash, decision_nonce, verifier_auth)
open_dispute(task_id, reason_code, evidence_hash)
resolve_dispute(task_id, outcome, verifier_quorum)
expire(task_id)
refund(task_id)
release(task_id)
register_policy(policy_id, policy_config)
register_provider(provider_id, metadata_hash)
update_provider_status(provider_id, status)
```

## Storage
Use instance storage for global configuration and persistent task records. Keep large data off-chain. Use compact enums and bounded collections to limit storage/resource costs.

## Authorization model
Recommended roles:
- Buyer authorization: create/fund/dispute according to task stage.
- Provider authorization: accept/start/submit evidence.
- Verifier authorization: approve/reject according to policy.
- Admin/guardian authorization: emergency pause/configuration only; never bypass normal settlement without explicit emergency semantics.

## Critical contract invariants
- Amount cannot become negative or exceed funded balance.
- Provider cannot self-approve its own result unless an explicitly declared policy allows it.
- Expired tasks cannot be released normally.
- A task cannot be funded twice unless the contract explicitly supports partial funding.
- A verification decision cannot be applied twice.
- Asset and recipient must remain bound to the original task.

## Events
Emit events for:
`EscrowCreated`, `EscrowFunded`, `TaskStarted`, `ProofSubmitted`, `VerificationAccepted`, `VerificationRejected`, `DisputeOpened`, `DisputeResolved`, `EscrowReleased`, `EscrowRefunded`, `EscrowExpired`.
