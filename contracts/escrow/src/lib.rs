#![no_std]

mod types;
#[cfg(test)]
mod test;

use soroban_sdk::{
    contract, contractimpl, panic_with_error, symbol_short, token, Address, BytesN, Env, Symbol,
};
use types::{DataKey, EscrowState, EscrowTask};

#[contract]
pub struct EscrowContract;

#[contractimpl]
impl EscrowContract {
    /// Initialize contract with an administrator address
    pub fn init(env: Env, admin: Address) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("Already initialized");
        }
        admin.require_auth();
        env.storage().instance().set(&DataKey::Admin, &admin);
    }

    /// Admin registers an authorized verifier
    pub fn register_verifier(env: Env, verifier: Address) {
        let admin: Address = env.storage().instance().get(&DataKey::Admin).expect("Not initialized");
        admin.require_auth();
        env.storage().persistent().set(&DataKey::Verifier(verifier.clone()), &true);
        env.events().publish((symbol_short!("ver_reg"), verifier), true);
    }

    /// Creates a new task escrow agreement
    pub fn create_escrow(
        env: Env,
        task_id: BytesN<32>,
        buyer: Address,
        provider: Address,
        asset: Address,
        amount: i128,
        input_hash: BytesN<32>,
        policy_id: u32,
        deadline: u64,
        nonce: u64,
    ) {
        buyer.require_auth();

        if amount <= 0 {
            panic!("Amount must be greater than zero");
        }
        if deadline <= env.ledger().timestamp() {
            panic!("Deadline must be in the future");
        }
        if env.storage().persistent().has(&DataKey::Task(task_id.clone())) {
            panic!("Task ID already exists");
        }

        let task = EscrowTask {
            task_id: task_id.clone(),
            buyer: buyer.clone(),
            provider: provider.clone(),
            asset,
            amount,
            input_hash,
            evidence_hash: None,
            policy_id,
            deadline,
            nonce,
            state: EscrowState::Created,
        };

        env.storage().persistent().set(&DataKey::Task(task_id.clone()), &task);
        env.events().publish((symbol_short!("created"), task_id, buyer), amount);
    }

    /// Buyer deposits funds into the escrow contract
    pub fn fund_escrow(env: Env, task_id: BytesN<32>) {
        let mut task: EscrowTask = env
            .storage()
            .persistent()
            .get(&DataKey::Task(task_id.clone()))
            .expect("Task not found");

        task.buyer.require_auth();

        if task.state != EscrowState::Created {
            panic!("Task is not in Created state");
        }

        // Transfer tokens from buyer to this contract
        let client = token::Client::new(&env, &task.asset);
        client.transfer(&task.buyer, &env.current_contract_address(), &task.amount);

        task.state = EscrowState::Funded;
        env.storage().persistent().set(&DataKey::Task(task_id.clone()), &task);
        env.events().publish((symbol_short!("funded"), task_id), task.amount);
    }

    /// Provider acknowledges acceptance and starts work
    pub fn acknowledge_start(env: Env, task_id: BytesN<32>) {
        let mut task: EscrowTask = env
            .storage()
            .persistent()
            .get(&DataKey::Task(task_id.clone()))
            .expect("Task not found");

        task.provider.require_auth();

        if task.state != EscrowState::Funded {
            panic!("Task is not in Funded state");
        }

        task.state = EscrowState::InProgress;
        env.storage().persistent().set(&DataKey::Task(task_id.clone()), &task);
        env.events().publish((symbol_short!("started"), task_id), true);
    }

    /// Provider submits the output evidence commitment before deadline
    pub fn submit_proof_commitment(env: Env, task_id: BytesN<32>, evidence_hash: BytesN<32>) {
        let mut task: EscrowTask = env
            .storage()
            .persistent()
            .get(&DataKey::Task(task_id.clone()))
            .expect("Task not found");

        task.provider.require_auth();

        if env.ledger().timestamp() > task.deadline {
            panic!("Task deadline has passed");
        }

        if task.state != EscrowState::InProgress && task.state != EscrowState::Funded {
            panic!("Invalid state for proof submission");
        }

        task.evidence_hash = Some(evidence_hash.clone());
        task.state = EscrowState::ProofSubmitted;

        env.storage().persistent().set(&DataKey::Task(task_id.clone()), &task);
        env.events().publish((symbol_short!("proof_sub"), task_id), evidence_hash);
    }

    /// Verifier approves task completion; funds are released to provider
    pub fn approve(env: Env, task_id: BytesN<32>, verifier: Address) {
        verifier.require_auth();

        let is_verifier: bool = env
            .storage()
            .persistent()
            .get(&DataKey::Verifier(verifier.clone()))
            .unwrap_or(false);

        if !is_verifier {
            panic!("Caller is not an authorized verifier");
        }

        let mut task: EscrowTask = env
            .storage()
            .persistent()
            .get(&DataKey::Task(task_id.clone()))
            .expect("Task not found");

        if task.state != EscrowState::ProofSubmitted {
            panic!("Task must be in ProofSubmitted state to approve");
        }

        // Release funds to the provider
        let client = token::Client::new(&env, &task.asset);
        client.transfer(&env.current_contract_address(), &task.provider, &task.amount);

        task.state = EscrowState::Released;
        env.storage().persistent().set(&DataKey::Task(task_id.clone()), &task);
        env.events().publish((symbol_short!("released"), task_id, task.provider), task.amount);
    }

    /// Verifier rejects task completion; funds are refunded to buyer
    pub fn reject(env: Env, task_id: BytesN<32>, verifier: Address) {
        verifier.require_auth();

        let is_verifier: bool = env
            .storage()
            .persistent()
            .get(&DataKey::Verifier(verifier.clone()))
            .unwrap_or(false);

        if !is_verifier {
            panic!("Caller is not an authorized verifier");
        }

        let mut task: EscrowTask = env
            .storage()
            .persistent()
            .get(&DataKey::Task(task_id.clone()))
            .expect("Task not found");

        if task.state != EscrowState::ProofSubmitted {
            panic!("Task must be in ProofSubmitted state to reject");
        }

        // Refund funds to buyer
        let client = token::Client::new(&env, &task.asset);
        client.transfer(&env.current_contract_address(), &task.buyer, &task.amount);

        task.state = EscrowState::Refunded;
        env.storage().persistent().set(&DataKey::Task(task_id.clone()), &task);
        env.events().publish((symbol_short!("rejected"), task_id, task.buyer), task.amount);
    }

    /// Buyer or Provider opens a dispute
    pub fn open_dispute(env: Env, task_id: BytesN<32>, caller: Address) {
        caller.require_auth();

        let mut task: EscrowTask = env
            .storage()
            .persistent()
            .get(&DataKey::Task(task_id.clone()))
            .expect("Task not found");

        if caller != task.buyer && caller != task.provider {
            panic!("Only buyer or provider can open dispute");
        }

        if task.state != EscrowState::ProofSubmitted {
            panic!("Can only dispute during ProofSubmitted state");
        }

        task.state = EscrowState::Disputed;
        env.storage().persistent().set(&DataKey::Task(task_id.clone()), &task);
        env.events().publish((symbol_short!("disputed"), task_id, caller), true);
    }

    /// Authorized verifier resolves dispute
    pub fn resolve_dispute(env: Env, task_id: BytesN<32>, verifier: Address, release_to_provider: bool) {
        verifier.require_auth();

        let is_verifier: bool = env
            .storage()
            .persistent()
            .get(&DataKey::Verifier(verifier.clone()))
            .unwrap_or(false);

        if !is_verifier {
            panic!("Caller is not an authorized verifier");
        }

        let mut task: EscrowTask = env
            .storage()
            .persistent()
            .get(&DataKey::Task(task_id.clone()))
            .expect("Task not found");

        if task.state != EscrowState::Disputed {
            panic!("Task is not in Disputed state");
        }

        let client = token::Client::new(&env, &task.asset);
        if release_to_provider {
            client.transfer(&env.current_contract_address(), &task.provider, &task.amount);
            task.state = EscrowState::Released;
            env.events().publish((symbol_short!("disp_rel"), task_id), task.amount);
        } else {
            client.transfer(&env.current_contract_address(), &task.buyer, &task.amount);
            task.state = EscrowState::Refunded;
            env.events().publish((symbol_short!("disp_ref"), task_id), task.amount);
        }

        env.storage().persistent().set(&DataKey::Task(task_id.clone()), &task);
    }

    /// Anyone can call expire after deadline has passed to refund buyer
    pub fn expire(env: Env, task_id: BytesN<32>) {
        let mut task: EscrowTask = env
            .storage()
            .persistent()
            .get(&DataKey::Task(task_id.clone()))
            .expect("Task not found");

        if env.ledger().timestamp() <= task.deadline {
            panic!("Deadline has not yet passed");
        }

        if task.state == EscrowState::Released || task.state == EscrowState::Refunded {
            panic!("Task already settled");
        }

        // If funds were deposited (Funded, InProgress, ProofSubmitted, Disputed), refund to buyer
        if task.state != EscrowState::Created {
            let client = token::Client::new(&env, &task.asset);
            client.transfer(&env.current_contract_address(), &task.buyer, &task.amount);
        }

        task.state = EscrowState::Refunded;
        env.storage().persistent().set(&DataKey::Task(task_id.clone()), &task);
        env.events().publish((symbol_short!("expired"), task_id, task.buyer), task.amount);
    }

    /// Read single task state
    pub fn get_task(env: Env, task_id: BytesN<32>) -> EscrowTask {
        env.storage()
            .persistent()
            .get(&DataKey::Task(task_id))
            .expect("Task not found")
    }
}
