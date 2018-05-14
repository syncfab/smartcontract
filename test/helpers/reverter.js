function Reverter(web3) {
  var snapshotId;

  this.revert = () => {
    return new Promise((resolve, reject) => {
      web3.currentProvider.sendAsync({
        jsonrpc: "2.0",
        method: "evm_revert",
        id: new Date().getTime(),
        params: [snapshotId]
      }, (err, result) => {
        if (err) {
          return reject(err);
        }
        return resolve(this.snapshot());
      });
    });
  };

  this.snapshot = () => {
    return new Promise((resolve, reject) => {
      web3.currentProvider.sendAsync({
        jsonrpc: "2.0",
        method: "evm_snapshot",
        id: new Date().getTime()
      }, (err, result) => {
        if (err) {
          return reject(err);
        }
        snapshotId = web3.toDecimal(result.result);
        return resolve();
      });
    });
  };
}

module.exports = Reverter;
