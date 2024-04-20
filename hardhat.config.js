require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 2 ** 32 - 1,
      }
    }
  },
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      forking: {
        url: "https://rpc.ankr.com/arbitrum",
        blockNumber: 202930186,
      },
    },
    localhost: {
      url: "http://127.0.0.1:8545",
    },
    arbitrum: {
      url: "https://rpc.ankr.com/arbitrum",
    }
  },
  mocha: {
    timeout: 20000,
  },
};
