# Layer-2 Scalability Lab (zkSync vs Ethereum L1)

This lab demonstrates how Layer 2 solutions (zkSync) improve scalability and cost compared to a local Ethereum Layer 1 (reth with 6s blocktime).  
You will:
- Run a local devnet with Docker
- Deploy a simple Counter contract to both L1 and L2
- Benchmark transaction throughput, latency, gas usage, and fees
- Interpret results to understand the scalability benefits of Layer 2

---

## Prerequisites

Make sure the following are installed:

- [Docker Desktop](https://www.docker.com/products/docker-desktop/)  
- [Node.js](https://nodejs.org/) (≥ 18.x recommended)  
- [npm](https://www.npmjs.com/) (comes with Node.js)  
- Git (to clone the repository)

---


## 1. Start Local Environment

Use the provided script:

```bash
./start.sh
```

This launches:
- **reth (L1)**: `http://127.0.0.1:8545` (blocktime = 6s)  
- **zkSync local-node (L2)**: `http://127.0.0.1:3050`  
- **Postgres**: used internally by zkSync  

Wait until zkSync is healthy (log: `server is ready`).

---

## 2. Install Dependencies

Go into the lab folder and install Node.js dependencies:

```bash
cd zksync-burst-demo
npm install
```

---

## 3. Compile Contracts

We’ll use a simple **Counter** contract (`contracts/Counter.sol`):

```bash
npx hardhat compile
```

---

## 4. Deploy Contracts

Deploy the Counter contract to both L1 and L2:

```bash
npx hardhat run scripts/deploy-l1.js --network l1Local
npx hardhat run scripts/deploy-l2.js --network zksyncLocal
```

Each script will print the deployed contract address.

👉 Copy these addresses and update them inside `scripts/bench.cjs` where indicated:

```js
  ADDR_L1: process.env.ADDR_L1 || "PASTE_L1_ADDRESS_HERE", 
  ADDR_L2: process.env.ADDR_L2 || "PASTE_L2_ADDRESS_HERE", 
```

---

## 5. Run Benchmarks

Run the benchmark script with different concurrency and signer settings.

### Example 1: Baseline (1 signer, 40 inflight)
```bash
INFLIGHT=40 MULTI_SIGNERS=1 node scripts/bench.cjs
```

### Example 2: Multi-signer (4 signers, 160 inflight)
```bash
INFLIGHT=160 MULTI_SIGNERS=4 node scripts/bench.cjs
```

### Example 3: Heavy load (8 signers, 320 inflight)
```bash
INFLIGHT=320 MULTI_SIGNERS=8 node scripts/bench.cjs
```

---

## 6. Interpreting Results

The benchmark outputs a table:

- **accept_tps** → throughput at RPC acceptance (higher on L2)  
- **accept_ms_p50/p90/p99** → latency percentiles for tx acceptance  
- **receipt_ms_p50/p90/p99** → latency percentiles for receipt confirmation  
- **gas_used / fees** → L2 txs cost less despite higher gas per tx  

### Expected outcome
- **Throughput:** L2 > L1 under load  
- **Latency:** L2 receipts ~3–5s predictable, L1 tied to 6s block time  
- **Fees:** L2 ~4–5× cheaper than L1  
- **Gas:** Higher per tx on L2 (due to VM overhead), but lower effective fees  

---

## 7. Reset Environment

Stop and clean containers:

```bash
./clear.sh
```

Remove Hardhat build artifacts:

```bash
cd zksync-burst-demo
npx hardhat clean
```

---

## ⚠️ Notes

- `rich-wallets.json` contains **prefunded test accounts**. Never use them on mainnet.  
- If you see `nonce too high` errors → reduce `INFLIGHT` or increase `MULTI_SIGNERS`.  
- Node version tested: **Node.js 18.x**  
- Docker images pinned:
  - `ghcr.io/paradigmxyz/reth:v1.3.12`
  - `matterlabs/local-node:latest2.0`

---

Congratulations! You now have hands-on experience comparing **Ethereum L1 vs zkSync L2** performance.
