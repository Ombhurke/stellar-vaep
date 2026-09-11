use soroban_sdk::{contracttype, Address, BytesN};

#[contracttype]
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum EscrowState {
    Created = 0,
    Funded = 1,
    InProgress = 2,
    ProofSubmitted = 3,
    Verified = 4,
    Released = 5,
    Refunded = 6,
    Disputed = 7,
    Expired = 8,
}

#[contracttype]
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum PolicyType {
    Deterministic = 1,
    Quorum2Of3 = 2,
    TimeoutRefund = 3,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct EscrowTask {
    pub task_id: BytesN<32>,
    pub buyer: Address,
    pub provider: Address,
    pub asset: Address,
    pub amount: i128,
    pub input_hash: BytesN<32>,
    pub evidence_hash: Option<BytesN<32>>,
    pub policy_id: u32,
    pub deadline: u64,
    pub nonce: u64,
    pub state: EscrowState,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum DataKey {
    Admin,
    Task(BytesN<32>),
    Verifier(Address),
    VerifierCount,
}
