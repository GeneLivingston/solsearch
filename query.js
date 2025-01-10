import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import dotenv from 'dotenv';

dotenv.config();

const connection = new Connection(process.env.SOLANA_RPC_URL, 'confirmed');

class SolanaQuery {
  constructor() {
    this.connection = connection;
  }

  async findTransactions({
    address = null,
    minAmount = 0,
    maxAmount = Infinity,
    limit = 10,
    beforeSignature = null,
  } = {}) {
    try {
      // Convert address string to PublicKey if provided
      const pubKey = address ? new PublicKey(address) : null;
      
      // Get signatures for the address
      const signatures = await this.connection.getSignaturesForAddress(
        pubKey,
        { before: beforeSignature, limit }
      );

      // Fetch and filter transactions
      const transactions = await Promise.all(
        signatures.map(async (sig) => {
          const tx = await this.connection.getTransaction(sig.signature);
          if (!tx || !tx.meta) return null;

          const amount = Math.abs(tx.meta.preBalances[0] - tx.meta.postBalances[0]) / LAMPORTS_PER_SOL;
          
          // Filter by amount range
          if (amount < minAmount || amount > maxAmount) return null;

          return {
            signature: sig.signature,
            blockTime: new Date(tx.blockTime * 1000).toISOString(),
            amount: amount.toFixed(2),
            sender: tx.transaction.message.accountKeys[0].toString(),
            receiver: tx.transaction.message.accountKeys[1].toString(),
            status: tx.meta.err ? 'failed' : 'success'
          };
        })
      );

      return transactions.filter(tx => tx !== null);
    } catch (error) {
      console.error('Error querying transactions:', error);
      throw error;
    }
  }
}

function printHelp() {
  console.log(`
Solana Transaction Query Tool

Usage:
  node src/query.js [options]

Options:
  --address     Wallet address to search for
  --min         Minimum transaction amount in SOL
  --max         Maximum transaction amount in SOL
  --limit       Maximum number of results (default: 10)
  --help        Show this help message

Examples:
  # Find transactions for an address
  node src/query.js --address FZMuHC5jvPkegCAzPRYLMp7YpNHzZMZhDwS2TLzFd1Uw

  # Find transactions over 1000 SOL
  node src/query.js --min 1000

  # Find transactions between 100-500 SOL with limit
  node src/query.js --min 100 --max 500 --limit 20
`);
}

function parseArgs() {
  const args = process.argv.slice(2);
  const params = {};

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--help':
        printHelp();
        process.exit(0);
      case '--address':
        params.address = args[++i];
        break;
      case '--min':
        params.minAmount = parseFloat(args[++i]);
        break;
      case '--max':
        params.maxAmount = parseFloat(args[++i]);
        break;
      case '--limit':
        params.limit = parseInt(args[++i]);
        break;
    }
  }

  return params;
}

async function main() {
  const params = parseArgs();
  
  if (Object.keys(params).length === 0) {
    printHelp();
    return;
  }

  console.log('Searching with parameters:', params);
  console.log('Please wait...\n');

  const query = new SolanaQuery();
  const results = await query.findTransactions(params);

  if (results.length === 0) {
    console.log('No transactions found matching the criteria.');
    return;
  }

  console.log(`Found ${results.length} transactions:\n`);
  console.table(results);
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  main().catch(console.error);
}
