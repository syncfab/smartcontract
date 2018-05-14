function sha3(...args) {
  var str = '';
  for (var i = 0; i < args.length; i++) {
    var hex = web3.toHex(args[i]).substr(2);  
    str += hex.length % 2 !== 0 ? `0${hex}` : hex;
  }
  return web3.sha3(str, {encoding: 'hex'});
}

module.exports = sha3;
