# Smart Contract Security Rules

## Mandatory checks
- Validate all addresses and contract identifiers.
- Validate amount > 0 where required.
- Enforce exact task existence and expected state.
- Enforce deadlines using ledger time where appropriate.
- Bind proof/decision to task-specific commitments.
- Maintain used nonce/decision identifiers.
- Prevent arbitrary callback or sub-invocation paths from bypassing policy.
- Keep admin functions isolated and strongly authorized.

## Recommended authorization architecture
Use Soroban contract-account or policy-signing capabilities where useful. A smart-wallet architecture can enforce spend caps, allow lists, session keys, and policy signers. The escrow contract itself should remain responsible for settlement invariants.

## Do not do
- Do not trust a boolean from the frontend as proof of completion.
- Do not trust provider-supplied `verified=true`.
- Do not store private keys in the contract repository.
- Do not expose admin secrets in build logs.
- Do not call arbitrary external contracts during critical settlement logic unless that dependency is explicitly part of the trust model.
