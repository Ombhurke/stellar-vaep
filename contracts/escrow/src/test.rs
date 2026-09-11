#![cfg(test)]

use super::*;
use soroban_sdk::{
    testutils::{Address as _, Ledger},
    token::{Client as TokenClient, StellarAssetClient},
    Address, BytesN, Env,
};

fn create_token_contract<'a>(env: &Env, admin: &Address) -> (TokenClient<'a>, StellarAssetClient<'a>) {
    let contract_id = env.register_stellar_asset_contract_v2(admin.clone());
    (
        TokenClient::new(env, &contract_id.address()),
        StellarAssetClient::new(env, &contract_id.address()),
    )
}

#[test]
fn test_escrow_happy_path() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let buyer = Address::generate(&env);
    let provider = Address::generate(&env);
    let verifier = Address::generate(&env);

    let (token_client, token_admin) = create_token_contract(&env, &admin);
    token_admin.mint(&buyer, &10_000_000);

    let contract_id = env.register(EscrowContract, ());
    let client = EscrowContractClient::new(&env, &contract_id);

    client.init(&admin);
    client.register_verifier(&verifier);

    let task_id = BytesN::from_array(&env, &[1u8; 32]);
    let input_hash = BytesN::from_array(&env, &[2u8; 32]);
    let evidence_hash = BytesN::from_array(&env, &[3u8; 32]);
    let deadline = 1000u64;

    client.create_escrow(
        &task_id,
        &buyer,
        &provider,
        &token_client.address,
        &5_000_000,
        &input_hash,
        &1,
        &deadline,
        &101,
    );

    let task = client.get_task(&task_id);
    assert_eq!(task.state, EscrowState::Created);

    client.fund_escrow(&task_id);
    assert_eq!(token_client.balance(&contract_id), 5_000_000);
    assert_eq!(client.get_task(&task_id).state, EscrowState::Funded);

    client.acknowledge_start(&task_id);
    assert_eq!(client.get_task(&task_id).state, EscrowState::InProgress);

    client.submit_proof_commitment(&task_id, &evidence_hash);
    assert_eq!(client.get_task(&task_id).state, EscrowState::ProofSubmitted);

    client.approve(&task_id, &verifier);
    assert_eq!(client.get_task(&task_id).state, EscrowState::Released);
    assert_eq!(token_client.balance(&provider), 5_000_000);
}

#[test]
fn test_escrow_rejection_path() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let buyer = Address::generate(&env);
    let provider = Address::generate(&env);
    let verifier = Address::generate(&env);

    let (token_client, token_admin) = create_token_contract(&env, &admin);
    token_admin.mint(&buyer, &10_000_000);

    let contract_id = env.register(EscrowContract, ());
    let client = EscrowContractClient::new(&env, &contract_id);

    client.init(&admin);
    client.register_verifier(&verifier);

    let task_id = BytesN::from_array(&env, &[4u8; 32]);
    let input_hash = BytesN::from_array(&env, &[5u8; 32]);
    let evidence_hash = BytesN::from_array(&env, &[6u8; 32]);
    let deadline = 1000u64;

    client.create_escrow(
        &task_id,
        &buyer,
        &provider,
        &token_client.address,
        &5_000_000,
        &input_hash,
        &1,
        &deadline,
        &102,
    );

    client.fund_escrow(&task_id);
    client.acknowledge_start(&task_id);
    client.submit_proof_commitment(&task_id, &evidence_hash);

    client.reject(&task_id, &verifier);
    assert_eq!(client.get_task(&task_id).state, EscrowState::Refunded);
    assert_eq!(token_client.balance(&buyer), 10_000_000);
}

#[test]
fn test_escrow_expiry_timeout() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let buyer = Address::generate(&env);
    let provider = Address::generate(&env);

    let (token_client, token_admin) = create_token_contract(&env, &admin);
    token_admin.mint(&buyer, &10_000_000);

    let contract_id = env.register(EscrowContract, ());
    let client = EscrowContractClient::new(&env, &contract_id);

    client.init(&admin);

    let task_id = BytesN::from_array(&env, &[7u8; 32]);
    let input_hash = BytesN::from_array(&env, &[8u8; 32]);
    let deadline = 500u64;

    client.create_escrow(
        &task_id,
        &buyer,
        &provider,
        &token_client.address,
        &5_000_000,
        &input_hash,
        &1,
        &deadline,
        &103,
    );

    client.fund_escrow(&task_id);
    assert_eq!(token_client.balance(&buyer), 5_000_000);

    // Fast forward ledger time past the deadline
    env.ledger().set_timestamp(600);

    client.expire(&task_id);
    assert_eq!(client.get_task(&task_id).state, EscrowState::Refunded);
    assert_eq!(token_client.balance(&buyer), 10_000_000);
}
