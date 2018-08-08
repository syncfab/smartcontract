const SolidityEvent = require("web3/lib/web3/event");

function decodeLogs(logs, contract, web3) {
  return logs.map(log => {
    var logABI = findAbiForSignature(log.topics[0], contract.abi, web3.sha3);

    if (logABI == null) {
      return null;
    }

    var decoder = new SolidityEvent(null, logABI, contract.address);
    return decoder.decode(log);
  }).filter(log => log != null);
}

function findAbiForSignature(signature, abi, sha3) {
  return abi.find(el =>
    el.type === 'event' &&
    signature.slice(-64) === sha3(`${el.name}(${el.inputs.map(input => input.type).join(',')})`).slice(-64)
  ) || null;
}

module.exports = decodeLogs;
