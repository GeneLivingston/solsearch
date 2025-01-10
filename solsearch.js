#!/usr/bin/env node

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
    startDate = null,
    endDate = null,
    hours = null,
  } = {}) {
    try {
      // Convert address string to PublicKey if provided
      const pubKey = address ? new PublicKey(address) : null;
      
      // If hours is provided, calculate the start date
      if (hours !== null) {
        const now = new Date();
        startDate = new Date(now - hours * 60 * 60 * 1000).toISOString();
        endDate = now.toISOString();
      }

      // Get signatures for the address
      const signatures = await this.connection.getSignaturesForAddress(
        pubKey,
        { before: beforeSignature, limit: limit * 2 } // Fetch more to account for date filtering
      );

      // Fetch and filter transactions
      const transactions = await Promise.all(
        signatures.map(async (sig) => {
          const tx = await this.connection.getTransaction(sig.signature);
          if (!tx || !tx.meta) return null;

          const amount = Math.abs(tx.meta.preBalances[0] - tx.meta.postBalances[0]) / LAMPORTS_PER_SOL;
          const txDate = new Date(tx.blockTime * 1000);
          
          // Filter by amount range
          if (amount < minAmount || amount > maxAmount) return null;

          // Filter by date range
          if (startDate && txDate < new Date(startDate)) return null;
          if (endDate && txDate > new Date(endDate)) return null;

          return {
            signature: sig.signature,
            blockTime: txDate.toISOString(),
            amount: amount.toFixed(2),
            sender: tx.transaction.message.accountKeys[0].toString(),
            receiver: tx.transaction.message.accountKeys[1].toString(),
            status: tx.meta.err ? 'failed' : 'success'
          };
        })
      );

      // Filter out nulls and limit results
      return transactions.filter(tx => tx !== null).slice(0, limit);
    } catch (error) {
      console.error('Error querying transactions:', error);
      throw error;
    }
  }
}

function printHelp() {
  console.log(`
Solana Transaction Search Tool (solsearch)

Usage:
  solsearch [options]

Options:
  --address     Wallet address to search for
  --min         Minimum transaction amount in SOL
  --max         Maximum transaction amount in SOL
  --limit       Maximum number of results (default: 10)
  --start-date  Start date for search (YYYY-MM-DD)
  --end-date    End date for search (YYYY-MM-DD)
  --hours       Search within past X hours
  --help        Show this help message

Examples:
  # Find transactions for an address
  solsearch --address FZMuHC5jvPkegCAzPRYLMp7YpNHzZMZhDwS2TLzFd1Uw

  # Find transactions over 1000 SOL
  solsearch --min 1000

  # Find transactions in the last 2 hours
  solsearch --hours 2

  # Find transactions between dates
  solsearch --start-date 2023-01-01 --end-date 2023-12-31

  # Combined search with hours
  solsearch --address FZMuHC5jvPkegCAzPRYLMp7YpNHzZMZhDwS2TLzFd1Uw --min 100 --hours 24
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
      case '--start-date':
        params.startDate = args[++i];
        break;
      case '--end-date':
        params.endDate = args[++i];
        break;
      case '--hours':
        params.hours = parseFloat(args[++i]);
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

  // Validate date formats
  if (params.startDate && !/^\d{4}-\d{2}-\d{2}$/.test(params.startDate)) {
    console.error('Error: Start date must be in YYYY-MM-DD format');
    process.exit(1);
  }
  if (params.endDate && !/^\d{4}-\d{2}-\d{2}$/.test(params.endDate)) {
    console.error('Error: End date must be in YYYY-MM-DD format');
    process.exit(1);
  }

  // Validate hours
  if (params.hours !== undefined && (params.hours <= 0 || isNaN(params.hours))) {
    console.error('Error: Hours must be a positive number');
    process.exit(1);
  }

  // Prevent mixing hours with start-date/end-date
  if (params.hours && (params.startDate || params.endDate)) {
    console.error('Error: Cannot use --hours with --start-date or --end-date');
    process.exit(1);
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
