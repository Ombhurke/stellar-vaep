# Decisions and Blockers

## ADR-001 — Positioning
VAEP is a verification/escrow layer, not a replacement for x402 or MPP.

## ADR-002 — Financial source of truth
Soroban escrow state is authoritative. Off-chain services mirror it.

## ADR-003 — Evidence model
Evidence is mostly off-chain, content-addressed/hashed, and referenced by compact on-chain commitments.

## ADR-004 — First verification policy
Deterministic verification is mandatory for the first end-to-end implementation because it is the easiest to make objectively reproducible.

## ADR-005 — Failure safety
Timeout must be a first-class settlement path.

## ADR-006 — Off-chain Database & Realtime (Strict Online Mode)
Supabase (PostgreSQL) is selected as the authoritative off-chain store for tasks, provider metadata, and dispute tracking. Supabase Realtime delivers live task lifecycle and verifier voting events directly to the frontend dashboard. To prevent masked errors, offline in-memory fallbacks are completely removed; the protocol operates in strict online-only mode connecting directly to Supabase Cloud.


## ADR-007 — Deterministic Hashing Standard
RFC 8785 canonical JSON stringification is enforced across all components (buyer, provider, verifier, gateway) to ensure consistent SHA-256 hashes regardless of JSON key order.

## Open blockers
- Exact competition minimum requirements have not been supplied in the current turn.
- Final supported asset choice must be aligned with competition rules and current testnet availability (default: native XLM / testnet USDC).
- Rust and Stellar CLI need to be configured on the host machine for smart contract compilation to wasm.

