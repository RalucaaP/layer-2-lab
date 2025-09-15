const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

const DEFAULTS = {
  RPC_L1: process.env.RPC_L1 || "http://127.0.0.1:8545",
  RPC_L2: process.env.RPC_L2 || "http://127.0.0.1:3050",
  ADDR_L1: process.env.ADDR_L1 || "PASTE_L1_ADDRESS_HERE",  //to complete with the address of the Layer1 Smart Contract
  ADDR_L2: process.env.ADDR_L2 || "PASTE_L2_ADDRESS_HERE",  ////to complete with the address of the Layer2 Smart Contract
  TXS: +(process.env.TXS || 1000),
  INFLIGHT: +(process.env.INFLIGHT || 200),
  GAS_LIMIT: BigInt(process.env.GAS_LIMIT || 150000),
  MULTI_SIGNERS: +(process.env.MULTI_SIGNERS || 1),
  RICH_WALLETS_PATH: process.env.RICH_WALLETS_PATH || path.join(__dirname, "../../local-setup/rich-wallets.json"),
};

function nowMs() { return Number(process.hrtime.bigint() / 1_000_000n); }
function pct(array, p) {
  if (array.length === 0) return 0;
  const idx = Math.ceil((p / 100) * array.length) - 1;
  return array.slice().sort((a, b) => a - b)[Math.max(0, Math.min(idx, array.length - 1))];
}
function summarize(name, startMs, sent, acceptMsArr, receiptMsArr, gasUsedTotal, feeWeiTotal) {
  const durSec = (nowMs() - startMs) / 1000;
  const tpsAccept = sent / durSec;
  const p50a = pct(acceptMsArr, 50).toFixed(1);
  const p90a = pct(acceptMsArr, 90).toFixed(1);
  const p99a = pct(acceptMsArr, 99).toFixed(1);
  const p50r = pct(receiptMsArr, 50).toFixed(1);
  const p90r = pct(receiptMsArr, 90).toFixed(1);
  const p99r = pct(receiptMsArr, 99).toFixed(1);

  return {
    layer: name,
    txs: sent,
    time_s: durSec.toFixed(2),
    accept_tps: tpsAccept.toFixed(1),
    accept_ms_p50: p50a,
    accept_ms_p90: p90a,
    accept_ms_p99: p99a,
    receipt_ms_p50: p50r,
    receipt_ms_p90: p90r,
    receipt_ms_p99: p99r,
    gas_used_total: gasUsedTotal.toString(),
    gas_used_avg: (gasUsedTotal / BigInt(Math.max(1, sent))).toString(),
    fee_eth_total: ethers.formatEther(feeWeiTotal),
    fee_eth_avg: ethers.formatEther(feeWeiTotal / BigInt(Math.max(1, sent))),
  };
}

function loadSigners(provider, n, pathToWallets) {
  const rich = JSON.parse(fs.readFileSync(pathToWallets, "utf8"));
  if (n > rich.length) {
    throw new Error(`Requested ${n} signers but only ${rich.length} in rich-wallets.json`);
  }
  return rich.slice(0, n).map((w) => new ethers.Wallet(w.privateKey, provider));
}

async function runOne(rpcUrl, contractAddr, txCount, inflightLimit, label, multiSigners, gasLimit, walletsPath) {
  const provider = new ethers.JsonRpcProvider(rpcUrl);

  const abi = [
    "function inc() public",
    "function count() public view returns (uint256)"
  ];
  const feeData = await provider.getFeeData();
  const common = {
    gasLimit,
    maxFeePerGas: feeData.maxFeePerGas,
    maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
  };

  const signers = loadSigners(provider, multiSigners, walletsPath);
  const counter = new ethers.Contract(contractAddr, abi, signers[0]);

  const nextNonce = {};
  for (const w of signers) {
    nextNonce[w.address] = await provider.getTransactionCount(w.address, "pending");
  }

  const startCount = await counter.count();
  console.log(`\n${label}: sending ${txCount} txs with inflight=${inflightLimit}, signers=${signers.length}`);

  let sent = 0;
  const acceptMsArr = [];
  const receiptMsArr = [];
  let gasUsedTotal = 0n;
  let feeWeiTotal = 0n;
  const inflight = new Set();
  const startMs = nowMs();

  async function sendOne(idx) {
    const signer = signers[idx % signers.length];
    const myNonce = nextNonce[signer.address]++;
    const t0 = nowMs();
    const tx = await counter.connect(signer).inc({ ...common, nonce: myNonce });
    const acceptMs = nowMs() - t0;
    acceptMsArr.push(acceptMs);

    const r0 = nowMs();
    const rec = await tx.wait();
    const receiptMs = nowMs() - r0;
    receiptMsArr.push(receiptMs);

    const gas = rec.gasUsed ?? 0n;
    const price = rec.effectiveGasPrice ?? rec.gasPrice ?? 0n;
    gasUsedTotal += gas;
    feeWeiTotal += gas * price;
  }

  let nextIdx = 0;
  while (nextIdx < txCount || inflight.size > 0) {
    while (nextIdx < txCount && inflight.size < inflightLimit) {
      const p = sendOne(nextIdx).finally(() => inflight.delete(p));
      inflight.add(p);
      nextIdx++;
      sent++;
    }
    if (inflight.size > 0) {
      await Promise.race([...inflight]);
    }
  }

  const finalCount = await counter.count();
  const summary = summarize(label, startMs, sent, acceptMsArr, receiptMsArr, gasUsedTotal, feeWeiTotal);
  return { summary, startCount: startCount.toString(), finalCount: finalCount.toString() };
}

async function main() {
  const cfg = { ...DEFAULTS };
  console.log("Config:", cfg);

  const l1 = await runOne(cfg.RPC_L1, cfg.ADDR_L1, cfg.TXS, cfg.INFLIGHT, "Layer 1", cfg.MULTI_SIGNERS, cfg.GAS_LIMIT, cfg.RICH_WALLETS_PATH);
  const l2 = await runOne(cfg.RPC_L2, cfg.ADDR_L2, cfg.TXS, cfg.INFLIGHT, "Layer 2", cfg.MULTI_SIGNERS, cfg.GAS_LIMIT, cfg.RICH_WALLETS_PATH);

  console.log("\nBenchmark Summary:");
  console.table([l1.summary, l2.summary]);
  console.log("\nCounters delta:", { l1: `${l1.startCount} -> ${l1.finalCount}`, l2: `${l2.startCount} -> ${l2.finalCount}` });
}

main().catch((e) => { console.error(e); process.exit(1); });
