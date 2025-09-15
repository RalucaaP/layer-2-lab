const { Deployer } = require("@matterlabs/hardhat-zksync-deploy");
const { Wallet } = require("zksync-ethers");
const hre = require("hardhat");

async function main() {
  const wallet = new Wallet(
    "0xac1e735be8536c6534bb4f17f06f6afc73b2b5ba84ac2cfb12f7461b20c0bbe3"
  );

  const deployer = new Deployer(hre, wallet);

  const artifact = await deployer.loadArtifact("CounterL2");

  const counter = await deployer.deploy(artifact);

  console.log("Counter (L2) at", await counter.getAddress());
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
