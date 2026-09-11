# MCP Integration

## Purpose
MCP is used as the service/tool interaction layer. VAEP wraps a paid MCP service with a task contract and verification lifecycle.

## Example MCP services
- `analyze_sentiment`
- `extract_entities`
- `transform_dataset`
- `run_classification`
- `generate_report`
- `query_specialized_data`

## Example flow
1. Buyer agent asks gateway for a provider that supports `transform_dataset`.
2. Provider advertises price, SLA, and verification policy.
3. Agent selects provider.
4. VAEP creates a task commitment.
5. Escrow is funded in USDC or another supported token.
6. MCP request is executed.
7. Provider returns result and evidence.
8. Verification network evaluates evidence.
9. Contract releases or refunds.

## Adapter rule
MCP transport details must remain behind an adapter interface. The core protocol must not be coupled to a specific MCP server implementation.
