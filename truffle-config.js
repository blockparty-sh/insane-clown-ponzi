require('dotenv').config();
const HDWalletProvider = require('truffle-hdwallet-provider-privkey');

module.exports = {
  contracts_build_directory: "./public/build",
  networks: {
    development: {
      host: "localhost",
      port: 7545,
      network_id: "*",
      gas: 6721975, //from ganache-cli output
      gasPrice: 1050000000, // 1.05 gwei
    },
    testnet: {
      provider: function() {
        return new HDWalletProvider(
          [process.env.PRIVATE_KEY],
          'http://35.220.203.194:8545',
        );
      },
      network_id: "10001",
      gas: 6721975, //from ganache-cli output
      gasPrice: 1050000000, // 1.05 gwei
      networkCheckTimeout: 999999,
    },
    mainnet: {
      provider: function() {
        return new HDWalletProvider(
          [process.env.PRIVATE_KEY],
          'https://smartbch.fountainhead.cash/mainnet',
        );
      },
      network_id: "10000",
      gas: 6721975, //from ganache-cli output
      gasPrice: 1050000000, // 1.05 gwei
      networkCheckTimeout: 999999,
    },
  },
  plugins: ["solidity-coverage"],
  compilers: {
    solc: {
      version: "0.8.3",
      settings: {
        optimizer: {
          enabled: true, // Default: false
          runs: 200      // Default: 200
        },
      }
    }
  }
};
