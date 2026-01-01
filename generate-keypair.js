const { Keypair } = require('@solana/web3.js');
const bs58 = require('bs58');

// Generate a new keypair
const keypair = Keypair.generate();

console.log('\n🔑 New Solana Keypair Generated!\n');
console.log('Public Key:', keypair.publicKey.toBase58());
console.log('\nPrivate Key (base58):', bs58.encode(keypair.secretKey));
console.log('\n⚠️  IMPORTANT: This is a TEST wallet. Fund it with devnet SOL only!');
console.log('Get devnet SOL: https://faucet.solana.com/\n');
console.log('Add this to your .env file:');
console.log(`SOLANA_PRIVATE_KEY=${bs58.encode(keypair.secretKey)}`);
console.log(`\nOr use this command:`);
console.log(`echo SOLANA_PRIVATE_KEY=${bs58.encode(keypair.secretKey)} > .env.key`);
