# Competition Demo Plan

## Demo objective
Show that an autonomous agent can purchase a real service while the financial settlement is controlled by verifiable task completion rather than blind payment.

## Scenario 1 — Success
1. Buyer agent selects a sentiment-analysis MCP service.
2. Provider quotes 0.50 USDC testnet.
3. VAEP creates escrow.
4. Buyer funds escrow.
5. MCP service executes.
6. Provider submits result + deterministic evidence hash.
7. Verifier approves.
8. Contract releases payment.
9. Dashboard shows the complete timeline and transaction hash.

## Scenario 2 — Bad provider result
1. Provider submits deliberately incorrect output.
2. Evidence verification fails.
3. Contract records rejection.
4. Buyer receives refund after the policy's settlement rule.
5. Dashboard marks provider attempt as failed.

## Scenario 3 — Provider disappears
1. Buyer funds escrow.
2. Provider never submits evidence.
3. Deadline is reached.
4. Anyone allowed by the contract calls expiry.
5. Funds refund to buyer.
6. Dashboard highlights the timeout protection.

## Optional Scenario 4 — Dispute
1. Provider submits plausible result.
2. Buyer disputes.
3. Three verifiers vote.
4. Two-of-three quorum resolves the task.
5. Settlement follows the quorum decision.

## Stage design
The live dashboard should visibly show:
- Agent identity
- Provider identity
- Task ID
- Escrow amount
- Verification policy
- State machine stage
- Evidence hash
- Verifier votes
- Countdown to deadline
- Final settlement

## Golden demo principle
Every impressive visual must correspond to a real protocol action. Do not fake the blockchain state in the UI.
