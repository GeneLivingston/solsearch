# solsearch
Node.js script to search the Solana blockchain; look for whales, find transactions


# Solana Whale Tracker

A command-line tool for tracking and searching Solana blockchain transactions. Monitor whale movements, search historical transactions, and track specific wallet addresses.

## Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```
3. Link the command globally:
```bash
npm link
```

## Configuration

Create a `.env` file in the project root with your Solana RPC URL:
```
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
```

## Quick Start Guide

### Basic Usage

1. Show help and available commands:
```bash
solsearch --help
```

2. Search transactions for a specific address:
```bash
solsearch --address FZMuHC5jvPkegCAzPRYLMp7YpNHzZMZhDwS2TLzFd1Uw
```

3. Find large transactions (e.g., over 1000 SOL):
```bash
solsearch --min 1000
```

### Tutorial: Common Use Cases

#### 1. Monitoring Whale Activity
Track large transactions over 1000 SOL in the past hour:
```bash
solsearch --min 1000 --hours 1
```

#### 2. Address Analysis
View all transactions for an address with minimum 100 SOL in the past 24 hours:
```bash
solsearch --address <wallet-address> --min 100 --hours 24
```

#### 3. Historical Analysis
Search transactions between specific dates:
```bash
solsearch --start-date 2023-01-01 --end-date 2023-12-31 --min 500
```

## Command Line Reference

### Available Options

| Option | Description | Example |
|--------|-------------|---------|
| `--address` | Wallet address to search for | `--address FZMuHC5...` |
| `--min` | Minimum transaction amount in SOL | `--min 100` |
| `--max` | Maximum transaction amount in SOL | `--max 1000` |
| `--limit` | Maximum number of results (default: 10) | `--limit 20` |
| `--start-date` | Start date for search (YYYY-MM-DD) | `--start-date 2023-01-01` |
| `--end-date` | End date for search (YYYY-MM-DD) | `--end-date 2023-12-31` |
| `--hours` | Search within past X hours | `--hours 24` |

### Search Parameters

1. **Amount-based search**
   - Use `--min` and `--max` to define transaction amount range
   - Values are in SOL (not lamports)
   ```bash
   solsearch --min 100 --max 500
   ```

2. **Time-based search**
   - Use `--hours` for recent transactions
   - Use `--start-date` and `--end-date` for specific date ranges
   ```bash
   # Last 2 hours
   solsearch --hours 2
   
   # Specific date range
   solsearch --start-date 2023-01-01 --end-date 2023-12-31
   ```

3. **Combined searches**
   ```bash
   # Large transactions from specific address in last 24 hours
   solsearch --address <wallet> --min 1000 --hours 24
   
   # Limit results
   solsearch --min 500 --hours 12 --limit 5
   ```

### Important Notes

1. Date format must be YYYY-MM-DD
2. Cannot combine `--hours` with `--start-date` or `--end-date`
3. Hours must be a positive number
4. All amounts are in SOL (not lamports)

## Output Format

Results are displayed in a table format with the following columns:
- `signature`: Transaction signature
- `blockTime`: Transaction timestamp
- `amount`: Transaction amount in SOL
- `sender`: Sender's wallet address
- `receiver`: Receiver's wallet address
- `status`: Transaction status (success/failed)

## Error Handling

The tool provides clear error messages for:
- Invalid date formats
- Invalid hour values
- Incompatible parameter combinations
- Network connection issues
- Invalid wallet addresses

## Examples

1. **Whale Transaction Monitoring**
   ```bash
   # Find all transactions over 10000 SOL in the last hour
   solsearch --min 10000 --hours 1
   ```

2. **Wallet Analysis**
   ```bash
   # All transactions from a wallet in the past 24 hours
   solsearch --address <wallet> --hours 24
   ```

3. **Historical Search**
   ```bash
   # Large transactions in January 2023
   solsearch --start-date 2023-01-01 --end-date 2023-01-31 --min 1000
   ```

4. **Limited Results**
   ```bash
   # Top 5 largest transactions in the past hour
   solsearch --hours 1 --limit 5
   ```
