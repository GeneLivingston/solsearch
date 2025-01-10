import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

// Connect to Solana mainnet
const connection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed');

// Minimum transaction size to track (in SOL)
const WHALE_THRESHOLD = 1000;

// List of known whale addresses to track
const WHALE_ADDRESSES = [
  // Add known whale addresses here
  'FZMuHC5jvPkegCAzPRYLMp7YpNHzZMZhDwS2TLzFd1Uw', // Example whale address
];

// Cache SOL price for 1 minute
let solPriceCache = {
  price: null,
  lastUpdate: 0
};

async function getSolanaPrice() {
  const now = Date.now();
  // Return cached price if less than 1 minute old
  if (solPriceCache.price && (now - solPriceCache.lastUpdate) < 60000) {
    return solPriceCache.price;
  }

  try {
    const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd');
    const data = await response.json();
    solPriceCache = {
      price: data.solana.usd,
      lastUpdate: now
    };
    return solPriceCache.price;
  } catch (error) {
    console.error('Error fetching SOL price:', error);
    return null;
  }
}

async function trackWhaleTransactions() {
  console.log('🐋 Starting Solana Whale Tracker...');
  console.log(`Monitoring transactions above ${WHALE_THRESHOLD} SOL\n`);

  try {
    // Subscribe to all transactions
    connection.onLogs('all', async (logs, ctx) => {
      if (logs.err) return;

      // Check if transaction involves any whale addresses
      const isWhaleTransaction = WHALE_ADDRESSES.some(address => 
        logs.signature.includes(address)
      );

      if (isWhaleTransaction) {
        try {
          const transaction = await connection.getTransaction(logs.signature);
          
          if (!transaction || !transaction.meta) return;

          // Calculate transaction value in SOL
          const value = transaction.meta.preBalances[0] - transaction.meta.postBalances[0];
          const valueInSol = Math.abs(value) / LAMPORTS_PER_SOL;

          // Only log transactions above threshold
          if (valueInSol >= WHALE_THRESHOLD) {
            const solPrice = await getSolanaPrice();
            const usdValue = solPrice ? (valueInSol * solPrice).toFixed(2) : 'Unknown';

            console.log('🚨 Whale Transaction Detected!');
            console.log(`Transaction: ${logs.signature}`);
            console.log(`Value: ${valueInSol.toFixed(2)} SOL`);
            console.log(`USD Value: $${usdValue}`);
            console.log(`SOL Price: $${solPrice}`);
            console.log('-------------------\n');
          }
        } catch (error) {
          console.error('Error processing transaction:', error);
        }
      }
    });

    console.log('Monitoring for whale transactions...');
  } catch (error) {
    console.error('Error setting up transaction monitoring:', error);
  }
}

// Start tracking
trackWhaleTransactions().catch(console.error);
