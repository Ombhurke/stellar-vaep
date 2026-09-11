import { Keypair } from '@stellar/stellar-sdk';

async function generateAndFund(roleName: string) {
  const pair = Keypair.random();
  const publicKey = pair.publicKey();
  const secretKey = pair.secret();

  console.log(`\n🔑 [${roleName}]`);
  console.log(`Public Key: ${publicKey}`);
  console.log(`Secret Key: ${secretKey}`);

  console.log(`Funding ${roleName} from Friendbot...`);
  try {
    const res = await fetch(`https://friendbot.stellar.org?addr=${publicKey}`);
    if (res.ok) {
      console.log(`✅ ${roleName} funded successfully! (10,000 XLM)`);
    } else {
      console.warn(`⚠️ Friendbot returned status ${res.status} (network rate limit or temporary pause)`);
    }
  } catch (err) {
    console.warn(`⚠️ Could not reach Friendbot:`, err);
  }

  return { publicKey, secretKey };
}

async function main() {
  console.log('=====================================================');
  console.log('VAEP — Stellar Testnet Keypair Generator & Faucet');
  console.log('=====================================================');

  const buyer = await generateAndFund('BUYER_AGENT');
  const provider = await generateAndFund('MCP_PROVIDER');
  const verifier1 = await generateAndFund('VERIFIER_NODE_1');
  const verifier2 = await generateAndFund('VERIFIER_NODE_2');
  const verifier3 = await generateAndFund('VERIFIER_NODE_3');

  console.log('\n=====================================================');
  console.log('Copy these values into your .env file:');
  console.log('=====================================================');
  console.log(`BUYER_PUBLIC_KEY=${buyer.publicKey}`);
  console.log(`BUYER_SECRET_KEY=${buyer.secretKey}`);
  console.log(`PROVIDER_PUBLIC_KEY=${provider.publicKey}`);
  console.log(`PROVIDER_SECRET_KEY=${provider.secretKey}`);
  console.log(`VERIFIER_1_PUBLIC_KEY=${verifier1.publicKey}`);
  console.log(`VERIFIER_1_SECRET_KEY=${verifier1.secretKey}`);
  console.log(`VERIFIER_2_PUBLIC_KEY=${verifier2.publicKey}`);
  console.log(`VERIFIER_2_SECRET_KEY=${verifier2.secretKey}`);
  console.log(`VERIFIER_3_PUBLIC_KEY=${verifier3.publicKey}`);
  console.log(`VERIFIER_3_SECRET_KEY=${verifier3.secretKey}`);
}

main().catch(console.error);
