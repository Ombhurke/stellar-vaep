# Data Model

## Task
- `task_id`: 32-byte unique ID.
- `buyer`: Stellar address.
- `provider`: Stellar address or registered provider ID.
- `service_id`: canonical provider service identifier.
- `input_hash`: commitment to normalized task input.
- `output_schema_hash`: optional expected schema commitment.
- `amount`: escrowed asset amount.
- `asset`: token contract/address identifier.
- `created_at`: ledger timestamp or protocol timestamp anchor.
- `deadline`: expiry timestamp.
- `verification_policy_id`: policy selector.
- `nonce`: unique per task/proof lifecycle.
- `state`: escrow state enum.

## Evidence
- `task_id`
- `evidence_id`
- `output_hash`
- `artifact_uri` or content-addressed pointer
- `provider_signature`
- `verifier_attestations[]`
- `submitted_at`
- `proof_type`
- `proof_version`

## Dispute
- `task_id`
- `opened_by`
- `reason_code`
- `evidence_refs[]`
- `opened_at`
- `challenge_deadline`
- `resolution`
- `verifier_commitments[]`

## Design rule
Large outputs belong off-chain. The chain should commit to the output/evidence, not store large model responses.

## Supabase Off-Chain Schema Mapping
- `providers`: `id`, `stellar_address`, `name`, `capabilities` (JSONB), `reputation_score`, `created_at`
- `tasks`: `id`, `task_id` (HEX/BYTEA), `buyer`, `provider`, `service_id`, `input_hash`, `output_schema_hash`, `amount`, `asset`, `deadline`, `verification_policy_id`, `nonce`, `state`, `tx_hash_create`, `tx_hash_fund`, `tx_hash_settle`, `created_at`, `updated_at`
- `evidence`: `id`, `task_id`, `evidence_id`, `output_hash`, `artifact_uri`, `provider_signature`, `raw_payload` (JSONB), `submitted_at`
- `verifier_attestations`: `id`, `task_id`, `verifier_address`, `decision` (`APPROVE` | `REJECT` | `ABSTAIN`), `signature`, `created_at`
- `disputes`: `id`, `task_id`, `opened_by`, `reason_code`, `challenge_deadline`, `resolution`, `created_at`
- `task_events`: `id`, `task_id`, `event_type`, `payload` (JSONB), `tx_hash`, `ledger_timestamp`

