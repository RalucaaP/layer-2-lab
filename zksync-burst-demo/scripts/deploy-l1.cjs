const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const C = await hre.ethers.getContractFactory("CounterL1");
  const c = await C.deploy();
  await c.waitForDeployment();

  const addr = await c.getAddress();
  console.log("Counter (L1) at", addr);

  const envPath = path.resolve(__dirname, "../.env");
  let envContent = "";
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, "utf8");
    envContent = envContent.replace(/ADDR_L1=.*/g, ""); 
  }
  envContent += `\nADDR_L1=${addr}`;
  fs.writeFileSync(envPath, envContent.trim() + "\n");
  console.log(`Saved ADDR_L1=${addr} to .env`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
