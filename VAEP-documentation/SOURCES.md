# Verified External Sources

These links establish the current Stellar capabilities that the architecture assumes. Re-check them during implementation because SDKs and APIs evolve.

1. Stellar Agentic Payments — https://developers.stellar.org/docs/build/agentic-payments
2. x402 on Stellar — https://developers.stellar.org/docs/build/agentic-payments/x402
3. MPP on Stellar — https://developers.stellar.org/docs/build/agentic-payments/mpp
4. MPP Charge Guide — https://developers.stellar.org/docs/build/agentic-payments/mpp/charge-guide
5. MPP Session Guide — https://developers.stellar.org/docs/build/agentic-payments/mpp/channel-guide
6. Stellar Smart Wallets — https://developers.stellar.org/docs/build/guides/contract-accounts/smart-wallets
7. Stellar Advanced Contract Account Patterns — https://developers.stellar.org/docs/build/guides/contract-accounts/advanced-patterns
8. Stellar simulateTransaction — https://developers.stellar.org/docs/data/apis/rpc/api-reference/methods/simulateTransaction

Current verified architectural notes:
- Stellar supports agentic payments through x402 and MPP.
- x402 on Stellar uses Soroban authorization entries for per-request payments and supports SEP-41 tokens, with USDC as the default documented asset.
- MPP supports one-time on-chain charge payments and session-style one-way payment channels for high-frequency interactions.
- Smart wallets/contract accounts can implement policy controls such as spend limits, allow lists, policy signers, time rules, and session keys.
- `simulateTransaction` can inspect likely execution effects without submitting the transaction.
