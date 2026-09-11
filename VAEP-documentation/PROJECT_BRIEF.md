# Project Brief

## Name
Verifiable Agent Escrow Protocol (VAEP)

## One-line pitch
A programmable escrow protocol that lets autonomous AI agents pay MCP services while releasing funds only after task-specific verification succeeds.

## Problem
Autonomous agents are increasingly able to call paid APIs, tools, data services, and compute providers. Payment protocols can establish that an agent authorized a payment, but payment alone does not prove that the purchased task was completed correctly. This creates a missing trust layer between autonomous purchasing and autonomous settlement.

## Solution
VAEP creates a task-scoped escrow agreement before work begins. The buyer deposits funds into a Soroban contract. The task contains immutable commitments to the requested work, price, deadline, and verification policy. The provider executes the task and submits a result plus evidence. A verifier evaluates the evidence according to the selected policy. The Soroban contract releases or refunds funds according to the verified outcome.

## Target use cases
1. AI agent purchases a data transformation from an MCP server.
2. AI agent rents model inference or GPU/compute time.
3. AI agent buys a signed data snapshot or analytic result.
4. Agent-to-agent workflows where one agent delegates a subtask to another.
5. Software agents paying for one-off specialized tools without requiring human escrow intervention.

## Non-goals
- Building another general-purpose payment rail.
- Claiming arbitrary AI output can be proven correct using a single hash.
- Putting large model outputs on chain.
- Treating an oracle as inherently trustworthy.
- Replacing MCP transport or discovery standards.
- Launching mainnet custody before the testnet protocol is proven.

## Design goals
- Deterministic settlement rules.
- Explicit evidence model.
- Multiple verification strategies.
- Timeout safety.
- Replay resistance.
- Provider identity and reputation.
- Dispute path.
- Strong observability for demos and real deployments.
- Clean separation between AI intelligence and financial authority.
