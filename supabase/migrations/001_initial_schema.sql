-- =============================================================================
-- VAEP (Verifiable Agent Escrow Protocol) — Initial Supabase / PostgreSQL Schema
-- Migration: 001_initial_schema.sql
-- =============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -----------------------------------------------------------------------------
-- 1. Custom Types & Enums
-- -----------------------------------------------------------------------------
DO $$ BEGIN
    CREATE TYPE escrow_state AS ENUM (
        'CREATED',
        'FUNDED',
        'IN_PROGRESS',
        'PROOF_SUBMITTED',
        'VERIFIED',
        'RELEASED',
        'REFUNDED',
        'DISPUTED',
        'EXPIRED'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE verification_decision AS ENUM (
        'APPROVE',
        'REJECT',
        'ABSTAIN'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE verification_policy_id AS ENUM (
        'deterministic-v1',
        'quorum-2-of-3-v1',
        'timeout-refund-v1'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- -----------------------------------------------------------------------------
-- 2. Providers Registry Table
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS providers (
    id TEXT PRIMARY KEY,
    stellar_address TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    capabilities JSONB NOT NULL DEFAULT '[]'::jsonb,
    price_stroops TEXT NOT NULL DEFAULT '5000000',
    sla_seconds INTEGER NOT NULL DEFAULT 300,
    reputation_score INTEGER NOT NULL DEFAULT 100,
    total_completed INTEGER NOT NULL DEFAULT 0,
    total_faulted INTEGER NOT NULL DEFAULT 0,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 3. Tasks Table
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id TEXT NOT NULL UNIQUE, -- 32-byte hex hash
    buyer TEXT NOT NULL,          -- Stellar Public Key
    provider TEXT NOT NULL,       -- Stellar Public Key
    service_id TEXT NOT NULL,
    input_hash TEXT NOT NULL,     -- SHA-256 of canonical input
    output_schema_hash TEXT,
    amount TEXT NOT NULL,         -- Stroops / token units
    asset TEXT NOT NULL,          -- Native XLM or SAC address
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deadline TIMESTAMPTZ NOT NULL,
    verification_policy_id verification_policy_id NOT NULL DEFAULT 'deterministic-v1',
    nonce TEXT NOT NULL,
    state escrow_state NOT NULL DEFAULT 'CREATED',
    tx_hash_create TEXT,
    tx_hash_fund TEXT,
    tx_hash_settle TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tasks_task_id ON tasks(task_id);
CREATE INDEX IF NOT EXISTS idx_tasks_buyer ON tasks(buyer);
CREATE INDEX IF NOT EXISTS idx_tasks_provider ON tasks(provider);
CREATE INDEX IF NOT EXISTS idx_tasks_state ON tasks(state);

-- -----------------------------------------------------------------------------
-- 4. Evidence Table
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS evidence (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id TEXT NOT NULL REFERENCES tasks(task_id) ON DELETE CASCADE,
    evidence_id TEXT NOT NULL,
    output_hash TEXT NOT NULL,
    artifact_uri TEXT,
    provider_signature TEXT NOT NULL,
    raw_payload JSONB,
    proof_type TEXT NOT NULL DEFAULT 'recompute',
    proof_version TEXT NOT NULL DEFAULT '1.0',
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_evidence_task_id ON evidence(task_id);

-- -----------------------------------------------------------------------------
-- 5. Verifier Attestations Table (for 2-of-3 Quorum & Audit)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS verifier_attestations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id TEXT NOT NULL REFERENCES tasks(task_id) ON DELETE CASCADE,
    verifier_address TEXT NOT NULL,
    decision verification_decision NOT NULL,
    decision_nonce TEXT NOT NULL,
    evidence_hash TEXT NOT NULL,
    signature TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_attestations_task_id ON verifier_attestations(task_id);

-- -----------------------------------------------------------------------------
-- 6. Disputes Table
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS disputes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id TEXT NOT NULL REFERENCES tasks(task_id) ON DELETE CASCADE,
    opened_by TEXT NOT NULL,
    reason_code TEXT NOT NULL,
    evidence_refs JSONB NOT NULL DEFAULT '[]'::jsonb,
    opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    challenge_deadline TIMESTAMPTZ NOT NULL,
    resolution TEXT,
    resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_disputes_task_id ON disputes(task_id);

-- -----------------------------------------------------------------------------
-- 7. Task Events Audit & Realtime Stream Table
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS task_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id TEXT NOT NULL REFERENCES tasks(task_id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    actor TEXT NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    tx_hash TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_events_task_id ON task_events(task_id);
CREATE INDEX IF NOT EXISTS idx_events_created_at ON task_events(created_at);

-- -----------------------------------------------------------------------------
-- 8. Enable Supabase Realtime Publication
-- -----------------------------------------------------------------------------
DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
    ALTER PUBLICATION supabase_realtime ADD TABLE task_events;
    ALTER PUBLICATION supabase_realtime ADD TABLE verifier_attestations;
EXCEPTION
    WHEN undefined_object THEN null;
    WHEN duplicate_object THEN null;
END $$;

-- -----------------------------------------------------------------------------
-- 9. Seed Initial Demo Provider
-- -----------------------------------------------------------------------------
INSERT INTO providers (id, stellar_address, name, description, capabilities, price_stroops, sla_seconds, reputation_score)
VALUES (
    'mcp-text-sentiment-analyzer',
    'GBUYER_DEMO_PROVIDER_ADDRESS_STUB_REPLACE_ME_12345678901234',
    'Aegis Deterministic Sentiment & Analytics Engine',
    'Deterministic sentiment analysis, linguistic metrics, and token frequency computation via MCP protocol.',
    '["sentiment-v1", "linguistics-metrics", "deterministic-v1"]'::jsonb,
    '5000000', -- 0.5 XLM
    120,
    98
) ON CONFLICT (id) DO NOTHING;
