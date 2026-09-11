# API Specification v0.1

## POST /providers
Register provider metadata.

## GET /providers
List provider capabilities, price ranges, verification policies, and reputation metrics.

## POST /tasks/quote
Request a signed or server-authenticated quote.

## POST /tasks
Create a task from a validated proposal.

## POST /tasks/{taskId}/fund
Prepare or submit the escrow funding transaction.

## POST /tasks/{taskId}/start
Provider acknowledges work start.

## POST /tasks/{taskId}/evidence
Submit an evidence envelope and artifact reference.

## POST /tasks/{taskId}/verify
Run or request the configured verification policy.

## POST /tasks/{taskId}/dispute
Open a dispute.

## POST /tasks/{taskId}/resolve
Record the verifier outcome after quorum/deterministic resolution.

## GET /tasks/{taskId}
Return normalized state, evidence references, events, and transaction hashes.

## GET /tasks/{taskId}/timeline
Return an ordered event timeline for dashboard visualization.

## API rule
No endpoint may directly release funds by accepting a generic `release=true` field. Settlement must invoke the Soroban contract through the protocol's authorized transition.
