module.exports = {
  contracts_build_directory: "./public/build",
  networks: {
    development: {
      host: "localhost",
      port: 7545,
      network_id: "*",
      gas: 6721975, //from ganache-cli output
      gasPrice: 1050000000, // 1.05 gwei
    }
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
