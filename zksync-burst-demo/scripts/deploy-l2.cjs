const { Deployer } = require("@matterlabs/hardhat-zksync-deploy");
const { Wallet } = require("zksync-ethers");
const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const wallet = new Wallet(
    "0xac1e735be8536c6534bb4f17f06f6afc73b2b5ba84ac2cfb12f7461b20c0bbe3"
  );

  const deployer = new Deployer(hre, wallet);
  const artifact = await deployer.loadArtifact("CounterL2");
  const counter = await deployer.deploy(artifact);

  const addr = await counter.getAddress();
  console.log("Counter (L2) at", addr);

  const envPath = path.resolve(__dirname, "../.env");
  let envContent = "";
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, "utf8");
    envContent = envContent.replace(/ADDR_L2=.*/g, ""); 
  }
  envContent += `\nADDR_L2=${addr}`;
  fs.writeFileSync(envPath, envContent.trim() + "\n");
  console.log(`Saved ADDR_L2=${addr} to .env`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
