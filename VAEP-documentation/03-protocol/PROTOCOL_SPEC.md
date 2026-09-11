# VAEP Protocol Specification v0.1

## Task proposal
```json
{
  "version": "0.1",
  "taskId": "hex-32-byte-id",
  "buyer": "G...",
  "provider": "G...",
  "serviceId": "mcp://provider/service",
  "inputHash": "sha256:...",
  "amount": "5000000",
  "asset": "C...",
  "deadline": 1770000000,
  "verificationPolicy": "deterministic-v1",
  "nonce": "unique-nonce"
}
```

## Evidence envelope
```json
{
  "version": "0.1",
  "taskId": "hex-32-byte-id",
  "evidenceId": "hex-id",
  "proofType": "deterministic-output-v1",
  "outputHash": "sha256:...",
  "artifactUri": "ipfs://... or https://...",
  "providerSignature": "base64...",
  "submittedAt": 1770000100
}
```

## Verification decision
```json
{
  "taskId": "hex-32-byte-id",
  "decision": "APPROVE",
  "policy": "deterministic-output-v1",
  "verifierId": "verifier-01",
  "evidenceHash": "sha256:...",
  "decisionNonce": "...",
  "expiresAt": 1770000200,
  "signature": "..."
}
```

## Canonicalization
All hashes must be computed over canonical serialization. The implementation must define field order, numeric encoding, string encoding, omitted/nullable field rules, and byte encoding before production use.

## Replay protection
A verification decision is valid only for the exact `taskId`, verification policy, evidence hash, and nonce/version recorded by the escrow contract. Reuse for any other task must fail.
