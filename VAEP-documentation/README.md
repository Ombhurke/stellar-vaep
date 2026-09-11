# VAEP — Verifiable Agent Escrow Protocol

## Purpose
This folder is the canonical engineering specification for the project.

VAEP is a trust and settlement layer for autonomous AI agents that buy MCP-exposed data, tools, or compute services. Money is locked in a Soroban escrow and is released only when a task satisfies a predefined verification policy. Failure, timeout, or successful dispute resolution leads to deterministic settlement.

## Core principle
The AI agent may negotiate and request work, but it must not have unilateral authority to release escrowed funds.

## Recommended project positioning
Stellar already provides agentic payment rails through x402 and MPP. VAEP therefore does **not** compete with those rails. It adds task-level escrow, verification, evidence, disputes, and reputation on top of payment infrastructure.

- x402 / MPP: how an agent pays.
- VAEP: when an agent is allowed to get paid.

## Repository conventions
- `01-product/` — product scope, personas, use cases, non-goals.
- `02-architecture/` — system architecture and component boundaries.
- `03-protocol/` — protocol messages and state machines.
- `04-soroban/` — smart-contract specification.
- `05-verification/` — proof/evidence and verifier design.
- `06-security/` — threat model and controls.
- `07-apis/` — off-chain API contracts.
- `08-demo/` — competition demo script and scenarios.
- `09-testing/` — test strategy and acceptance criteria.
- `10-agent-instructions/` — instructions for the coding IDE agent.
- `11-requirements/` — competition requirements and traceability.

## Source of truth priority
1. Exact competition requirements, once supplied.
2. This documentation folder.
3. Existing code.
4. IDE-agent assumptions.

The IDE agent must never silently change protocol or security semantics. Changes must be reflected in the relevant documentation first.
