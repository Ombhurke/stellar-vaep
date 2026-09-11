# Secure Implementation Checklist

## Secrets
- `.env` only for local secrets.
- `.env.example` contains placeholders only.
- Never commit seed phrases/private keys.
- Use separate testnet accounts.

## API
- Validate JSON schema.
- Rate-limit provider/evidence endpoints.
- Use request IDs.
- Sign sensitive workflow messages where applicable.
- Reject stale timestamps/nonces.

## Contract
- Test every state transition and every invalid transition.
- Test repeated release/refund calls.
- Test expiry boundary timestamps.
- Test wrong asset, wrong buyer, wrong provider, wrong task ID, wrong evidence hash.
- Test verifier authorization failure.

## Frontend
- Treat displayed state as derived data.
- Show source transaction hash and contract event where available.
- Never present a locally calculated "success" status as settlement truth.
