# Threat Model

| Threat | Example | Primary control |
|---|---|---|
| Fake provider | Attacker impersonates a service | provider registry + signatures |
| Fake result | Provider submits fabricated output | evidence verification |
| Replay | Old approval reused on new task | task ID + nonce + evidence binding |
| Buyer fraud | Buyer disputes valid result | independent verification |
| Provider disappearance | No result before deadline | expiry + refund |
| Verifier collusion | Verifiers coordinate falsely | quorum + diverse verifiers |
| Oracle failure | Oracle unavailable | fallback policy / timeout |
| Contract bug | Incorrect state transition | invariants + tests + audit |
| Frontend compromise | UI shows fake approval | on-chain state is source of truth |
| Key compromise | Provider/verifier key stolen | key rotation + scoped authorization |
| DoS | Excessive task/proof traffic | rate limiting + quotas |
| Resource exhaustion | Huge evidence or expensive call | bounded payloads + off-chain artifacts |

## Threat-model assumptions
- Stellar consensus and the Soroban runtime are trusted as the settlement substrate.
- Off-chain verifier logic is not inherently trusted.
- MCP service metadata can be malicious.
- AI-generated instructions can be malicious or incorrect.

## Security posture
Financial authority is minimized on the AI side and concentrated in deterministic contract rules plus explicit verification authorization.
