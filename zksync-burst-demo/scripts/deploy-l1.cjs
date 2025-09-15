const hre = require("hardhat");

async function main() {
  const C = await hre.ethers.getContractFactory("CounterL1");
  const c = await C.deploy();
  await c.waitForDeployment();
  console.log("Counter (L1) at", await c.getAddress());
}

main().catch((err) => { console.error(err); process.exit(1); });
