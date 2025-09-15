require("@matterlabs/hardhat-zksync-solc");
require("@matterlabs/hardhat-zksync-deploy");
require("@nomicfoundation/hardhat-toolbox");

module.exports = {
  defaultNetwork: "hardhat",
  networks: {
    l1Local: {
      url: "http://localhost:8545",
      accounts: [
        "0xac1e735be8536c6534bb4f17f06f6afc73b2b5ba84ac2cfb12f7461b20c0bbe3"
      ],
    },
    zksyncLocal: {
      url: "http://localhost:3050",
      ethNetwork: "http://localhost:8545", 
      zksync: true,
      accounts: [
        "0xf12e28c0eb1ef4ff90478f6805b68d63737b7f33abfa091601140805da450d93"
      ],
    },
  },
  solidity: {
    version: "0.8.20",  
  },
  zksolc: {
    version: "1.5.1",   
    compilerSource: "binary",
    settings: {},
  },
};
