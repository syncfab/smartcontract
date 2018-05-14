module.exports = {
  networks: {
    development: {
      host: "localhost",
      port: 7545,
      network_id: "*", // Match any network id
      gas: 4000000,
      gasPrice: 20000000000,
    }
  }
};
