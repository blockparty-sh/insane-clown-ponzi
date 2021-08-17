module.exports = {
  contracts_build_directory: "./public/build",
  networks: {
    development: {
      host: "localhost",
      port: 7545,
      network_id: "*",
      gas: 6721975, //from ganache-cli output
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
