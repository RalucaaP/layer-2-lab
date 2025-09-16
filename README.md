# Layer-2 Scalability Lab (zkSync vs Ethereum L1)

This lab demonstrates how Layer 2 solutions (zkSync) improve scalability and cost compared to a local Ethereum Layer 1 (reth with 6s blocktime).  
You will:
- Run a local devnet with Docker
- Deploy a simple Counter contract to both L1 and L2
- Benchmark transaction throughput, latency, gas usage, and fees
- Interpret results to understand the scalability benefits of Layer 2

---

## Prerequisites

You only need:
- Ubuntu 22.04+ (or WSL2 if on Windows)
- Git (to clone this repo)

Everything else (Node.js, Docker, dependencies) is installed using the provided scripts.

---


## 1. Install prerequisites

Run the provided script:

```bash
./install_prerequisites.sh
```

This will install:
- **Node.js v20**
- **Docker**
- **Docker Compose**
- Start the Docker service automatically

> ⚠️ If you see `Permission denied`, run:
> ```bash
> chmod +x install_prerequisites.sh
> ./install_prerequisites.sh
> ```

---

## 2. Install project dependencies

Run the second script to install Node.js dependencies for the lab:

```bash
./install-deps.sh
```

> ⚠️ If you see `Permission denied`, run:
> ```bash
> chmod +x install-deps.sh
> ./install-deps.sh
> ```

---

## 3. Start the local setup

Launch the local zkSync (L2) + L1 environment using Docker:

```bash
./start.sh
```

This will start:
- **reth (L1)**: `http://127.0.0.1:8545` (blocktime = 6s)  
- **zkSync local-node (L2)**: `http://127.0.0.1:3050`  
- **Postgres**: used internally by zkSync  

Wait until zkSync is healthy (log: `server is ready`).

---

## 4. Compile Smart Contracts

Before deployment, compile the example contracts (Counter1.sol and Counter2.sol):

```bash
cd zksync-burst-demo
npx hardhat compile
```

---

## 5. Deploy Contracts

Deploy Counter1 on L1 and Counter2 on L2 (make sure you are in layer-2-lab/zksync-burst-demo folder):

```bash
npx hardhat run scripts/deploy-l1.cjs --network l1Local
npx hardhat run scripts/deploy-l2.cjs --network zksyncLocal
```

Each script will print the deployed contract address.

Copy these addresses and update them inside `scripts/bench.cjs` where indicated:

```js
  ADDR_L1: process.env.ADDR_L1 || "PASTE_L1_ADDRESS_HERE", 
  ADDR_L2: process.env.ADDR_L2 || "PASTE_L2_ADDRESS_HERE", 
```

---

## 6. Run Benchmarks

Run the benchmark script with different concurrency and signer settings (inside the zksync-burst-demo folder).

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

## 7. Interpreting Results

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

## 8. Reset Environment

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
- Node version tested: **Node.js 20.10.x**  
- Docker images pinned:
  - `ghcr.io/paradigmxyz/reth:v1.3.12`
  - `matterlabs/local-node:latest2.0`

---

Congratulations! You now have hands-on experience comparing **Ethereum L1 vs zkSync L2** performance.
