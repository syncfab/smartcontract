const decodeLogs = require('./helpers/decodelogs');
const bytes32 = require('./helpers/bytes32');
const sha3 = require('./helpers/sha3');

module.exports = accounts => {
  const UINT_256_MINUS_3 = '1.15792089237316195423570985008687907853269984665640564039457584007913129639933e+77';
  const UINT_256_MINUS_2 = '1.15792089237316195423570985008687907853269984665640564039457584007913129639934e+77';
  const UINT_256_MINUS_1 = '1.15792089237316195423570985008687907853269984665640564039457584007913129639935e+77';
  const UINT_256 = '1.15792089237316195423570985008687907853269984665640564039457584007913129639936e+77';
  const UINT_255_MINUS_1 = '5.7896044618658097711785492504343953926634992332820282019728792003956564819967e+76';
  const UINT_255 = '5.7896044618658097711785492504343953926634992332820282019728792003956564819968e+76';

  const BYTES_32 = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
  const BITS_257 = '0x10000000000000000000000000000000000000000000000000000000000000000';

  const SYMBOL = 'TEST';
  const SYMBOL2 = 'TEST2';
  const NAME = 'Test Name';
  const DESCRIPTION = 'Test Description';
  const VALUE = 1001;
  const VALUE2 = 30000;
  const BASE_UNIT = 2;
  const IS_REISSUABLE = false;

  const ICAP = "XE73TSTXREG123456789";

  const Features = { Issue: 0, TransferWithReference: 1, Revoke: 2, ChangeOwnership: 3, Allowances: 4, ICAP: 5 };

  const getEvents = (tx, contract, name = false) => decodeLogs(tx.receipt.logs, contract, web3).filter(log => !name || log.event === name);

  it('should be possible to get total supply', function() {
    return this.etoken2.setProxy(this.assetProxy.address, SYMBOL).then(() => {
      return this.assetProxy.totalSupply.call();
    }).then(result => {
      assert.equal(result.valueOf(), VALUE);
    });
  });
  it('should be possible to get balance for holder', function() {
    return this.etoken2.setProxy(this.assetProxy.address, SYMBOL).then(() => {
      return this.assetProxy.balanceOf.call(accounts[0]);
    }).then(result => {
      assert.equal(result.valueOf(), VALUE);
    });
  });
  it('should be possible to get total supply if not allowed', function() {
    return this.etoken2.setProxy(this.assetProxy.address, SYMBOL2).then(() => {
      return this.assetProxy.totalSupply.call();
    }).then(result => {
      assert.equal(result.valueOf(), VALUE);
    });
  });
  it('should be possible to get balance if not allowed', function() {
    return this.etoken2.setProxy(this.assetProxy.address, SYMBOL2).then(() => {
      return this.assetProxy.balanceOf.call(accounts[0]);
    }).then(result => {
      assert.equal(result.valueOf(), VALUE);
    });
  });
  it('should not emit transfer event from not base', function() {
    const owner = accounts[0];
    const nonOwner = accounts[1];
    return this.etoken2.setProxy(this.assetProxy.address, SYMBOL2).then(() => {
      return this.assetProxy.emitTransfer(owner, nonOwner, 100);
    }).then(tx => getEvents(tx, this.assetProxy, 'Transfer')).then(events => {
      assert.equal(events.length, 0);
    });
  });
  it('should not emit approve event from not base', function() {
    const owner = accounts[0];
    const nonOwner = accounts[1];
    return this.etoken2.setProxy(this.assetProxy.address, SYMBOL2).then(() => {
      return this.assetProxy.emitApprove(owner, nonOwner, 100);
    }).then(tx => getEvents(tx, this.assetProxy, 'Approval')).then(events => {
      assert.equal(events.length, 0);
    });
  });
  it('should not be possible to transfer if not allowed', function() {
    const owner = accounts[0];
    const nonOwner = accounts[1];
    return this.etoken2.setProxy(this.assetProxy.address, SYMBOL2).then(() => {
      return this.assetProxy.transfer(nonOwner, 100);
    }).then(tx => getEvents(tx, this.assetProxy, 'Transfer')).then(events => {
      assert.equal(events.length, 0);
      return this.etoken2.balanceOf.call(nonOwner, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), 0);
      return this.etoken2.balanceOf.call(owner, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), VALUE);
    });
  });
  it('should not be possible to transfer amount 1 with balance 0', function() {
    const owner = accounts[0];
    const nonOwner = accounts[1];
    const amount = 1;
    return this.etoken2.setProxy(this.assetProxy.address, SYMBOL).then(() => {
      return this.assetProxy.transfer(nonOwner, VALUE);
    }).then(() => {
      return this.assetProxy.transfer(nonOwner, amount);
    }).then(() => {
      return this.etoken2.balanceOf.call(nonOwner, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), VALUE);
      return this.etoken2.balanceOf.call(owner, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), 0);
    });
  });
  it('should not be possible to transfer amount 2 with balance 1', function() {
    const owner = accounts[0];
    const nonOwner = accounts[1];
    const value = 1;
    const amount = 2;
    return this.etoken2.setProxy(this.assetProxy.address, SYMBOL).then(() => {
      return this.assetProxy.transfer(nonOwner, VALUE - value);
    }).then(() => {
      return this.assetProxy.transfer(nonOwner, amount);
    }).then(() => {
      return this.etoken2.balanceOf.call(nonOwner, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), VALUE - value);
      return this.etoken2.balanceOf.call(owner, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), value);
    });
  });
  it('should not be possible to transfer amount 0', function() {
    const owner = accounts[0];
    const nonOwner = accounts[1];
    const amount = 0;
    return this.etoken2.setProxy(this.assetProxy.address, SYMBOL).then(() => {
      return this.assetProxy.transfer(nonOwner, amount);
    }).then(tx => getEvents(tx, this.assetProxy, 'Transfer')).then(events => {
      assert.equal(events.length, 0);
      return this.etoken2.balanceOf.call(nonOwner, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), 0);
      return this.etoken2.balanceOf.call(owner, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), VALUE);
    });
  });
  it('should not be possible to transfer to oneself', function() {
    const owner = accounts[0];
    const amount = 100;
    return this.etoken2.setProxy(this.assetProxy.address, SYMBOL).then(() => {
      return this.assetProxy.transfer(owner, amount);
    }).then(tx => getEvents(tx, this.assetProxy, 'Transfer')).then(events => {
      assert.equal(events.length, 0);
      return this.etoken2.balanceOf.call(owner, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), VALUE);
      return this.etoken2.balanceOf.call(owner, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), VALUE);
    });
  });
  it('should be possible to transfer amount 1 to existing holder with 0 balance', function() {
    const holder = accounts[0];
    const holder2 = accounts[1];
    const amount = 1;
    return this.etoken2.setProxy(this.assetProxy.address, SYMBOL).then(() => {
      return this.assetProxy.transfer(holder2, VALUE);
    }).then(() => {
      return this.assetProxy.transfer(holder, amount, {from: holder2});
    }).then(() => {
      return this.etoken2.balanceOf.call(holder2, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), VALUE - amount);
      return this.etoken2.balanceOf.call(holder, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), amount);
    });
  });
  it('should be possible to transfer amount 1 to missing holder', function() {
    const holder = accounts[0];
    const holder2 = accounts[1];
    const amount = 1;
    return this.etoken2.setProxy(this.assetProxy.address, SYMBOL).then(() => {
      return this.assetProxy.transfer(holder2, amount);
    }).then(() => {
      return this.etoken2.balanceOf.call(holder2, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), amount);
      return this.etoken2.balanceOf.call(holder, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), VALUE - amount);
    });
  });
  it('should be possible to transfer amount 1 to holder with non-zero balance', function() {
    const holder = accounts[0];
    const holder2 = accounts[1];
    const balance2 = 100;
    const amount = 1;
    return this.etoken2.setProxy(this.assetProxy.address, SYMBOL).then(() => {
      return this.assetProxy.transfer(holder2, balance2);
    }).then(() => {
      return this.assetProxy.transfer(holder2, amount);
    }).then(() => {
      return this.etoken2.balanceOf.call(holder2, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), balance2 + amount);
      return this.etoken2.balanceOf.call(holder, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), VALUE - balance2 - amount);
    });
  });
  it('should checkSigned on transfer', function() {
    let checks = 0;
    return this.etoken2.setProxy(this.assetProxy.address, SYMBOL).then(() => {
      return this.etoken2.signChecks.call();
    }).then(result => {
      checks = result.toNumber();
      return this.assetProxy.transfer(accounts[1], 10);
    }).then(() => {
      return this.etoken2.signChecks.call();
    }).then(result => {
      assert.equal(result.valueOf(), checks + 1);
      return this.etoken2.lastOperation.call();
    }).then(result => {
      assert.equal(result.valueOf(), sha3(this.etoken2.contract.proxyTransferFromWithReference.getData(accounts[0], accounts[1], 10, SYMBOL, "", accounts[0]), bytes32(1)));
    });
  });
  it('should keep transfers separated between assets', function() {
    const holder = accounts[0];
    const holder2 = accounts[1];
    const amount = 100;
    return this.etoken2.setProxy(this.assetProxy.address, SYMBOL).then(() => {
      return this.assetProxy.transfer(holder2, amount);
    }).then(tx => getEvents(tx, this.assetProxy, 'Transfer')).then(events => {
      assert.equal(events.length, 1);
      assert.equal(events[0].args.from.valueOf(), holder);
      assert.equal(events[0].args.to.valueOf(), holder2);
      assert.equal(events[0].args.value.valueOf(), amount);
      return this.etoken2.balanceOf.call(holder, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), VALUE - amount);
      return this.etoken2.balanceOf.call(holder2, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), amount);
      return this.etoken2.balanceOf.call(holder, SYMBOL2);
    }).then(result => {
      assert.equal(result.valueOf(), VALUE2);
      return this.etoken2.balanceOf.call(holder2, SYMBOL2);
    }).then(result => {
      assert.equal(result.valueOf(), 0);
    });
  });
  it('should emit transfer event from base', function() {
    const holder = accounts[0];
    const holder2 = accounts[1];
    const amount = 100;
    return this.etoken2.setProxy(this.assetProxy.address, SYMBOL).then(() => {
      return this.etoken2.transfer(holder2, amount, SYMBOL);
    }).then(tx => getEvents(tx, this.assetProxy, 'Transfer')).then(events => {
      assert.equal(events.length, 1);
      assert.equal(events[0].args.from.valueOf(), holder);
      assert.equal(events[0].args.to.valueOf(), holder2);
      assert.equal(events[0].args.value.valueOf(), amount);
    });
  });

  it('should not be possible to set allowance if not allowed', function() {
    const owner = accounts[0];
    const spender = accounts[1];
    return this.etoken2.setProxy(this.assetProxy.address, SYMBOL2).then(() => {
      return this.assetProxy.approve(spender, 100);
    }).then(tx => getEvents(tx, this.assetProxy, 'Approval')).then(events => {
      assert.equal(events.length, 0);
      return this.etoken2.allowance.call(owner, spender);
    }).then(result => {
      assert.equal(result.valueOf(), 0);
    });
  });
  it('should not be possible to set allowance for oneself', function() {
    const owner = accounts[0];
    return this.etoken2.setProxy(this.assetProxy.address, SYMBOL).then(() => {
      return this.assetProxy.approve(owner, 100);
    }).then(tx => getEvents(tx, this.assetProxy, 'Approval')).then(events => {
      assert.equal(events.length, 0);
      return this.etoken2.allowance.call(owner, owner, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), 0);
    });
  });
  it('should be possible to set allowance from missing holder to missing holder', function() {
    const holder = accounts[1];
    const spender = accounts[2];
    const value = 100;
    return this.etoken2.setProxy(this.assetProxy.address, SYMBOL).then(() => {
      return this.assetProxy.approve(spender, value, {from: holder});
    }).then(tx => getEvents(tx, this.assetProxy, 'Approval')).then(events => {
      assert.equal(events.length, 1);
      assert.equal(events[0].args.from.valueOf(), holder);
      assert.equal(events[0].args.spender.valueOf(), spender);
      assert.equal(events[0].args.value.valueOf(), value);
      return this.assetProxy.allowance.call(holder, spender);
    }).then(result => {
      assert.equal(result.valueOf(), value);
      return this.assetProxy.allowance.call(holder, spender);
    }).then(result => {
      assert.equal(result.valueOf(), value);
    });
  });
  it('should emit allowance from base', function() {
    const holder = accounts[1];
    const spender = accounts[2];
    const value = 100;
    return this.etoken2.setProxy(this.assetProxy.address, SYMBOL).then(() => {
      return this.etoken2.approve(spender, value, SYMBOL, {from: holder});
    }).then(tx => getEvents(tx, this.assetProxy, 'Approval')).then(events => {
      assert.equal(events.length, 1);
      assert.equal(events[0].args.from.valueOf(), holder);
      assert.equal(events[0].args.spender.valueOf(), spender);
      assert.equal(events[0].args.value.valueOf(), value);
    });
  });
  it('should be possible to set allowance from missing holder to existing holder', function() {
    const holder = accounts[1];
    const spender = accounts[0];
    const value = 100;
    return this.etoken2.setProxy(this.assetProxy.address, SYMBOL).then(() => {
      return this.assetProxy.approve(spender, value, {from: holder});
    }).then(() => {
      return this.assetProxy.allowance.call(holder, spender);
    }).then(result => {
      assert.equal(result.valueOf(), value);
    });
  });
  it('should be possible to set allowance from existing holder to missing holder', function() {
    const holder = accounts[0];
    const spender = accounts[2];
    const value = 100;
    return this.etoken2.setProxy(this.assetProxy.address, SYMBOL).then(() => {
      return this.assetProxy.approve(spender, value, {from: holder});
    }).then(() => {
      return this.assetProxy.allowance.call(holder, spender);
    }).then(result => {
      assert.equal(result.valueOf(), value);
    });
  });
  it('should be possible to set allowance from existing holder to existing holder', function() {
    const holder = accounts[0];
    const spender = accounts[2];
    const value = 100;
    return this.etoken2.setProxy(this.assetProxy.address, SYMBOL).then(() => {
      return this.assetProxy.transfer(spender, 1, {from: holder});
    }).then(() => {
      return this.assetProxy.approve(spender, value, {from: holder});
    }).then(() => {
      return this.assetProxy.allowance.call(holder, spender);
    }).then(result => {
      assert.equal(result.valueOf(), value);
    });
  });
  it('should be possible to set allowance value 0', function() {
    // Covered by 'should be possible to override allowance value with 0 value'.
    return Promise.resolve();
  });
  it('should be possible to set allowance with (2**256 - 1) value', function() {
    const holder = accounts[0];
    const spender = accounts[1];
    const value = UINT_256_MINUS_1;
    return this.etoken2.setProxy(this.assetProxy.address, SYMBOL).then(() => {
      return this.assetProxy.approve(spender, value);
    }).then(() => {
      return this.assetProxy.allowance.call(holder, spender);
    }).then(result => {
      assert.equal(result.valueOf(), value);
    });
  });
  it('should be possible to set allowance value less then balance', function() {
    const holder = accounts[0];
    const spender = accounts[1];
    const value = 1;
    return this.etoken2.setProxy(this.assetProxy.address, SYMBOL).then(() => {
      return this.assetProxy.approve(spender, value);
    }).then(() => {
      return this.assetProxy.allowance.call(holder, spender);
    }).then(result => {
      assert.equal(result.valueOf(), value);
    });
  });
  it('should be possible to set allowance value equal to balance', function() {
    const holder = accounts[0];
    const spender = accounts[1];
    const value = VALUE;
    return this.etoken2.setProxy(this.assetProxy.address, SYMBOL).then(() => {
      return this.assetProxy.approve(spender, value);
    }).then(() => {
      return this.assetProxy.allowance.call(holder, spender);
    }).then(result => {
      assert.equal(result.valueOf(), value);
    });
  });
  it('should be possible to set allowance value more then balance', function() {
    // Covered by 'should be possible to set allowance with (2**256 - 1) value'.
    return Promise.resolve();
  });
  it('should be possible to override allowance value with 0 value', function() {
    const holder = accounts[0];
    const spender = accounts[1];
    const value = 0;
    return this.etoken2.setProxy(this.assetProxy.address, SYMBOL).then(() => {
      return this.assetProxy.approve(spender, 100);
    }).then(() => {
      return this.assetProxy.approve(spender, value);
    }).then(() => {
      return this.assetProxy.allowance.call(holder, spender);
    }).then(result => {
      assert.equal(result.valueOf(), value);
    });
  });
  it('should be possible to override allowance value with non 0 value', function() {
    const holder = accounts[0];
    const spender = accounts[1];
    const value = 1000;
    return this.etoken2.setProxy(this.assetProxy.address, SYMBOL).then(() => {
      return this.assetProxy.approve(spender, 100);
    }).then(() => {
      return this.assetProxy.approve(spender, value);
    }).then(() => {
      return this.assetProxy.allowance.call(holder, spender);
    }).then(result => {
      assert.equal(result.valueOf(), value);
    });
  });
  it('should not affect balance when setting allowance', function() {
    const holder = accounts[0];
    return this.etoken2.setProxy(this.assetProxy.address, SYMBOL).then(() => {
      return this.assetProxy.approve(accounts[1], 100);
    }).then(() => {
      return this.etoken2.balanceOf.call(holder, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), VALUE);
    });
  });
  it('should be possible to set allowance', function() {
    // Covered by other tests above.
    return Promise.resolve();
  });

  it('should not be possible to do allowance transfer if not allowed', function() {
    const holder = accounts[0];
    const spender = accounts[1];
    return this.etoken2.approve(spender, 50, SYMBOL).then(() => {
      return this.assetProxy.transferFrom(holder, spender, 50, {from: spender});
    }).then(tx => getEvents(tx, this.assetProxy, 'Transfer')).then(events => {
      assert.equal(events.length, 0);
      return this.etoken2.balanceOf.call(holder, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), VALUE);
    });
  });
  it('should not be possible to do allowance transfer by not allowed existing spender, from existing holder', function() {
    const holder = accounts[0];
    const spender = accounts[1];
    const value = 100;
    const expectedSpenderBalance = 100;
    const expectedHolderBalance = VALUE - value;
    return this.etoken2.setProxy(this.assetProxy.address, SYMBOL).then(() => {
      return this.assetProxy.transfer(spender, value);
    }).then(() => {
      return this.assetProxy.transferFrom(holder, spender, 50, {from: spender});
    }).then(() => {
      return this.etoken2.balanceOf.call(spender, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), expectedSpenderBalance);
      return this.etoken2.balanceOf.call(holder, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), expectedHolderBalance);
    });
  });
  it('should not be possible to do allowance transfer by not allowed existing spender, from missing holder', function() {
    const holder = accounts[2];
    const spender = accounts[1];
    const value = 100;
    const expectedSpenderBalance = 100;
    const expectedHolderBalance = 0;
    return this.etoken2.setProxy(this.assetProxy.address, SYMBOL).then(() => {
      return this.assetProxy.transfer(spender, value);
    }).then(() => {
      return this.assetProxy.transferFrom(holder, spender, 50, {from: spender});
    }).then(() => {
      return this.etoken2.balanceOf.call(spender, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), expectedSpenderBalance);
      return this.etoken2.balanceOf.call(holder, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), expectedHolderBalance);
    });
  });
  it('should not be possible to do allowance transfer by not allowed missing spender, from existing holder', function() {
    const holder = accounts[0];
    const spender = accounts[1];
    const expectedSpenderBalance = 0;
    const expectedHolderBalance = VALUE;
    return this.etoken2.setProxy(this.assetProxy.address, SYMBOL).then(() => {
      return this.assetProxy.transferFrom(holder, spender, 50, {from: spender});
    }).then(() => {
      return this.etoken2.balanceOf.call(spender, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), expectedSpenderBalance);
      return this.etoken2.balanceOf.call(holder, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), expectedHolderBalance);
    });
  });
  it('should not be possible to do allowance transfer by not allowed missing spender, from missing holder', function() {
    const holder = accounts[2];
    const spender = accounts[1];
    const expectedSpenderBalance = 0;
    const expectedHolderBalance = 0;
    return this.etoken2.setProxy(this.assetProxy.address, SYMBOL).then(() => {
      return this.assetProxy.transferFrom(holder, spender, 50, {from: spender});
    }).then(() => {
      return this.etoken2.balanceOf.call(spender, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), expectedSpenderBalance);
      return this.etoken2.balanceOf.call(holder, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), expectedHolderBalance);
    });
  });
  it('should not be possible to do allowance transfer from and to the same holder', function() {
    const holder = accounts[0];
    const spender = accounts[1];
    return this.etoken2.setProxy(this.assetProxy.address, SYMBOL).then(() => {
      return this.assetProxy.approve(spender, 50);
    }).then(() => {
      return this.assetProxy.transferFrom(holder, holder, 50, {from: spender});
    }).then(tx => getEvents(tx, this.assetProxy)).then(events => {
      assert.equal(events.length, 0);
      return this.etoken2.balanceOf.call(holder, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), VALUE);
    });
  });
  it('should not be possible to do allowance transfer with 0 value', function() {
    const holder = accounts[0];
    const spender = accounts[1];
    const value = 0;
    const resultValue = 0;
    return this.etoken2.setProxy(this.assetProxy.address, SYMBOL).then(() => {
      return this.assetProxy.approve(spender, 100);
    }).then(() => {
      return this.assetProxy.transferFrom(holder, spender, value, {from: spender});
    }).then(tx => getEvents(tx, this.assetProxy)).then(events => {
      assert.equal(events.length, 0);
      return this.etoken2.balanceOf.call(holder, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), VALUE);
      return this.etoken2.balanceOf.call(spender, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), resultValue);
    });
  });
  it('should not be possible to do allowance transfer with value less than balance, more than allowed', function() {
    const holder = accounts[0];
    const spender = accounts[1];
    const balance = VALUE;
    const value = 999;
    const allowed = 998;
    const resultValue = 0;
    return this.etoken2.setProxy(this.assetProxy.address, SYMBOL).then(() => {
      return this.assetProxy.approve(spender, allowed);
    }).then(() => {
      return this.assetProxy.transferFrom(holder, spender, value, {from: spender});
    }).then(() => {
      return this.etoken2.balanceOf.call(holder, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), balance);
      return this.etoken2.balanceOf.call(spender, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), resultValue);
    });
  });
  it('should not be possible to do allowance transfer with value equal to balance, more than allowed', function() {
    const holder = accounts[0];
    const spender = accounts[1];
    const balance = VALUE;
    const value = VALUE;
    const allowed = 999;
    const resultValue = 0;
    return this.etoken2.setProxy(this.assetProxy.address, SYMBOL).then(() => {
      return this.assetProxy.approve(spender, allowed);
    }).then(() => {
      return this.assetProxy.transferFrom(holder, spender, value, {from: spender});
    }).then(() => {
      return this.etoken2.balanceOf.call(holder, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), balance);
      return this.etoken2.balanceOf.call(spender, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), resultValue);
    });
  });
  it('should not be possible to do allowance transfer with value more than balance, less than allowed', function() {
    const holder = accounts[0];
    const spender = accounts[1];
    const balance = VALUE;
    const value = VALUE + 1;
    const allowed = value + 1;
    const resultValue = 0;
    return this.etoken2.setProxy(this.assetProxy.address, SYMBOL).then(() => {
      return this.assetProxy.approve(spender, allowed);
    }).then(() => {
      return this.assetProxy.transferFrom(holder, spender, value, {from: spender});
    }).then(() => {
      return this.etoken2.balanceOf.call(holder, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), balance);
      return this.etoken2.balanceOf.call(spender, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), resultValue);
    });
  });
  it('should not be possible to do allowance transfer with value less than balance, more than allowed after another tranfer', function() {
    const holder = accounts[0];
    const spender = accounts[1];
    const balance = VALUE;
    const anotherValue = 10;
    const value = VALUE - anotherValue - 1;
    const allowed = value - 1;
    const expectedHolderBalance = balance - anotherValue;
    const resultValue = anotherValue;
    return this.etoken2.setProxy(this.assetProxy.address, SYMBOL).then(() => {
      return this.assetProxy.approve(spender, allowed);
    }).then(() => {
      return this.assetProxy.transferFrom(holder, spender, anotherValue, {from: spender});
    }).then(() => {
      return this.assetProxy.transferFrom(holder, spender, value, {from: spender});
    }).then(() => {
      return this.etoken2.balanceOf.call(holder, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), expectedHolderBalance);
      return this.etoken2.balanceOf.call(spender, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), resultValue);
    });
  });
  it('should not be possible to do allowance transfer when allowed for another symbol', function() {
    const holder = accounts[0];
    const spender = accounts[1];
    const balance = VALUE;
    const value = 200;
    const allowed = 1000;
    const resultValue = 0;
    return this.etoken2.setProxy(this.assetProxy.address, SYMBOL).then(() => {
      return this.etoken2.approve(spender, allowed, SYMBOL2);
    }).then(() => {
      return this.assetProxy.transferFrom(holder, spender, value, {from: spender});
    }).then(() => {
      return this.etoken2.balanceOf.call(holder, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), balance);
      return this.etoken2.balanceOf.call(spender, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), resultValue);
      return this.etoken2.balanceOf.call(holder, SYMBOL2);
    }).then(result => {
      assert.equal(result.valueOf(), VALUE2);
      return this.etoken2.balanceOf.call(spender, SYMBOL2);
    }).then(result => {
      assert.equal(result.valueOf(), 0);
    });
  });
  it('should be possible to do allowance transfer by allowed existing spender', function() {
    const holder = accounts[0];
    const spender = accounts[1];
    const existValue = 100;
    const value = 300;
    const expectedHolderBalance = VALUE - existValue - value;
    const expectedSpenderBalance = existValue + value;
    return this.etoken2.setProxy(this.assetProxy.address, SYMBOL).then(() => {
      return this.assetProxy.transfer(spender, existValue);
    }).then(() => {
      return this.assetProxy.approve(spender, value);
    }).then(() => {
      return this.assetProxy.transferFrom(holder, spender, value, {from: spender});
    }).then(() => {
      return this.etoken2.balanceOf.call(holder, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), expectedHolderBalance);
      return this.etoken2.balanceOf.call(spender, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), expectedSpenderBalance);
    });
  });
  it('should be possible to do allowance transfer by allowed missing spender', function() {
    const holder = accounts[0];
    const spender = accounts[1];
    const value = 300;
    const expectedHolderBalance = VALUE - value;
    const expectedSpenderBalance = value;
    return this.etoken2.setProxy(this.assetProxy.address, SYMBOL).then(() => {
      return this.assetProxy.approve(spender, value);
    }).then(() => {
      return this.assetProxy.transferFrom(holder, spender, value, {from: spender});
    }).then(() => {
      return this.etoken2.balanceOf.call(holder, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), expectedHolderBalance);
      return this.etoken2.balanceOf.call(spender, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), expectedSpenderBalance);
    });
  });
  it('should be possible to do allowance transfer to oneself', function() {
    // Covered by 'should be possible to do allowance transfer by allowed existing spender'.
    return Promise.resolve();
  });
  it('should be possible to do allowance transfer to existing holder', function() {
    const holder = accounts[0];
    const spender = accounts[1];
    const receiver = accounts[2];
    const existValue = 100;
    const value = 300;
    const expectedHolderBalance = VALUE - existValue - value;
    const expectedReceiverBalance = existValue + value;
    return this.etoken2.setProxy(this.assetProxy.address, SYMBOL).then(() => {
      return this.assetProxy.transfer(receiver, existValue);
    }).then(() => {
      return this.assetProxy.approve(spender, value);
    }).then(() => {
      return this.assetProxy.transferFrom(holder, receiver, value, {from: spender});
    }).then(tx => getEvents(tx, this.assetProxy)).then(events => {
      assert.equal(events.length, 1);
      assert.equal(events[0].args.from.valueOf(), holder);
      assert.equal(events[0].args.to.valueOf(), receiver);
      assert.equal(events[0].args.value.valueOf(), value);
      return this.etoken2.balanceOf.call(holder, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), expectedHolderBalance);
      return this.etoken2.balanceOf.call(receiver, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), expectedReceiverBalance);
    });
  });
  it('should emit allowance transfer event from base', function() {
    const holder = accounts[0];
    const spender = accounts[1];
    const receiver = accounts[2];
    const existValue = 100;
    const value = 300;
    return this.etoken2.setProxy(this.assetProxy.address, SYMBOL).then(() => {
      return this.assetProxy.transfer(receiver, existValue);
    }).then(() => {
      return this.assetProxy.approve(spender, value);
    }).then(() => {
      return this.etoken2.transferFrom(holder, receiver, value, SYMBOL, {from: spender});
    }).then(tx => getEvents(tx, this.assetProxy)).then(events => {
      assert.equal(events.length, 1);
      assert.equal(events[0].args.from.valueOf(), holder);
      assert.equal(events[0].args.to.valueOf(), receiver);
      assert.equal(events[0].args.value.valueOf(), value);
    });
  });
  it('should be possible to do allowance transfer to missing holder', function() {
    const holder = accounts[0];
    const spender = accounts[1];
    const receiver = accounts[2];
    const value = 300;
    const expectedHolderBalance = VALUE - value;
    const expectedReceiverBalance = value;
    return this.etoken2.setProxy(this.assetProxy.address, SYMBOL).then(() => {
      return this.assetProxy.approve(spender, value);
    }).then(() => {
      return this.assetProxy.transferFrom(holder, receiver, value, {from: spender});
    }).then(() => {
      return this.etoken2.balanceOf.call(holder, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), expectedHolderBalance);
      return this.etoken2.balanceOf.call(receiver, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), expectedReceiverBalance);
    });
  });
  it('should be possible to do allowance transfer with value less than balance and less than allowed', function() {
    const holder = accounts[0];
    const spender = accounts[1];
    const balance = VALUE;
    const value = balance - 1;
    const allowed = value + 1;
    const expectedHolderBalance = balance - value;
    return this.etoken2.setProxy(this.assetProxy.address, SYMBOL).then(() => {
      return this.assetProxy.approve(spender, allowed);
    }).then(() => {
      return this.assetProxy.transferFrom(holder, spender, value, {from: spender});
    }).then(() => {
      return this.etoken2.balanceOf.call(holder, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), expectedHolderBalance);
      return this.etoken2.balanceOf.call(spender, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), value);
    });
  });
  it('should be possible to do allowance transfer with value less than balance and equal to allowed', function() {
    const holder = accounts[0];
    const spender = accounts[1];
    const balance = VALUE;
    const value = balance - 1;
    const allowed = value;
    const expectedHolderBalance = balance - value;
    return this.etoken2.setProxy(this.assetProxy.address, SYMBOL).then(() => {
      return this.assetProxy.approve(spender, allowed);
    }).then(() => {
      return this.assetProxy.transferFrom(holder, spender, value, {from: spender});
    }).then(() => {
      return this.etoken2.balanceOf.call(holder, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), expectedHolderBalance);
      return this.etoken2.balanceOf.call(spender, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), value);
    });
  });
  it('should be possible to do allowance transfer with value equal to balance and less than allowed', function() {
    const holder = accounts[0];
    const spender = accounts[1];
    const balance = VALUE;
    const value = balance;
    const allowed = value + 1;
    const expectedHolderBalance = balance - value;
    return this.etoken2.setProxy(this.assetProxy.address, SYMBOL).then(() => {
      return this.assetProxy.approve(spender, allowed);
    }).then(() => {
      return this.assetProxy.transferFrom(holder, spender, value, {from: spender});
    }).then(() => {
      return this.etoken2.balanceOf.call(holder, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), expectedHolderBalance);
      return this.etoken2.balanceOf.call(spender, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), value);
    });
  });
  it('should be possible to do allowance transfer with value equal to balance and equal to allowed', function() {
    const holder = accounts[0];
    const spender = accounts[1];
    const balance = VALUE;
    const value = balance;
    const allowed = value;
    const expectedHolderBalance = balance - value;
    return this.etoken2.setProxy(this.assetProxy.address, SYMBOL).then(() => {
      return this.assetProxy.approve(spender, allowed);
    }).then(() => {
      return this.assetProxy.transferFrom(holder, spender, value, {from: spender});
    }).then(() => {
      return this.etoken2.balanceOf.call(holder, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), expectedHolderBalance);
      return this.etoken2.balanceOf.call(spender, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), value);
    });
  });
  it('should be possible to do allowance transfer with value less than balance and less than allowed after another transfer', function() {
    const holder = accounts[0];
    const spender = accounts[1];
    const balance = VALUE;
    const anotherValue = 1;
    const value = balance - anotherValue - 1;
    const allowed = value + 1;
    const expectedSpenderBalance = anotherValue + value;
    const expectedHolderBalance = balance - anotherValue - value;
    return this.etoken2.setProxy(this.assetProxy.address, SYMBOL).then(() => {
      return this.assetProxy.approve(spender, allowed);
    }).then(() => {
      return this.assetProxy.transferFrom(holder, spender, anotherValue, {from: spender});
    }).then(() => {
      return this.assetProxy.transferFrom(holder, spender, value, {from: spender});
    }).then(() => {
      return this.etoken2.balanceOf.call(holder, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), expectedHolderBalance);
      return this.etoken2.balanceOf.call(spender, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), expectedSpenderBalance);
    });
  });
  it('should be possible to do allowance transfer with value less than balance and equal to allowed after another transfer', function() {
    const holder = accounts[0];
    const spender = accounts[1];
    const balance = VALUE;
    const anotherValue = 1;
    const value = balance - anotherValue - 1;
    const allowed = value + anotherValue;
    const expectedSpenderBalance = anotherValue + value;
    const expectedHolderBalance = balance - anotherValue - value;
    return this.etoken2.setProxy(this.assetProxy.address, SYMBOL).then(() => {
      return this.assetProxy.approve(spender, allowed);
    }).then(() => {
      return this.assetProxy.transferFrom(holder, spender, anotherValue, {from: spender});
    }).then(() => {
      return this.assetProxy.transferFrom(holder, spender, value, {from: spender});
    }).then(() => {
      return this.etoken2.balanceOf.call(holder, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), expectedHolderBalance);
      return this.etoken2.balanceOf.call(spender, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), expectedSpenderBalance);
    });
  });
  it('should checkSigned approve and allowance transfer', function() {
    let checks = 0;
    return this.etoken2.setProxy(this.assetProxy.address, SYMBOL).then(() => {
      return this.etoken2.signChecks.call();
    }).then(result => {
      checks = result.toNumber();
      return this.assetProxy.approve(accounts[1], 100);
    }).then(() => {
      return this.assetProxy.transferFrom(accounts[0], accounts[1], 10, {from: accounts[1]});
    }).then(() => {
      return this.etoken2.signChecks.call();
    }).then(result => {
      assert.equal(result.valueOf(), checks + 2);
      return this.etoken2.lastOperation.call();
    }).then(result => {
      assert.equal(result.valueOf(), sha3(this.etoken2.contract.proxyTransferFromWithReference.getData(accounts[0], accounts[1], 10, SYMBOL, "", accounts[1]), bytes32(2)));
    });
  });
  it('should checkSigned on approve', function() {
    let checks = 0;
    return this.etoken2.setProxy(this.assetProxy.address, SYMBOL).then(() => {
      return this.etoken2.signChecks.call();
    }).then(result => {
      checks = result.toNumber();
      return this.assetProxy.approve(accounts[1], 100);
    }).then(() => {
      return this.etoken2.signChecks.call();
    }).then(result => {
      assert.equal(result.valueOf(), checks + 1);
      return this.etoken2.lastOperation.call();
    }).then(result => {
      assert.equal(result.valueOf(), sha3(this.etoken2.contract.proxyApprove.getData(accounts[1], 100, SYMBOL, accounts[0]), bytes32(1)));
    });
  });

  it('should return allowance when not allowed', function() {
    const holder = accounts[0];
    const spender = accounts[1];
    const value = 100;
    return this.etoken2.setProxy(this.assetProxy.address, SYMBOL).then(() => {
      return this.assetProxy.approve(spender, value);
    }).then(() => {
      return this.assetProxy.allowance.call(holder, spender);
    }).then(result => {
      assert.equal(result.valueOf(), value);
    });
  });
  it('should return 0 allowance for existing owner and not allowed existing spender', function() {
    const holder = accounts[0];
    const spender = accounts[1];
    return this.etoken2.setProxy(this.assetProxy.address, SYMBOL).then(() => {
      return this.assetProxy.transfer(spender, 100);
    }).then(() => {
      return this.assetProxy.allowance.call(holder, spender);
    }).then(result => {
      assert.equal(result.valueOf(), 0);
    });
  });
  it('should return 0 allowance for existing owner and not allowed missing spender', function() {
    const holder = accounts[0];
    const spender = accounts[1];
    return this.etoken2.setProxy(this.assetProxy.address, SYMBOL).then(() => {
      return this.assetProxy.allowance.call(holder, spender);
    }).then(result => {
      assert.equal(result.valueOf(), 0);
    });
  });
  it('should return 0 allowance for missing owner and existing spender', function() {
    const holder = accounts[1];
    const spender = accounts[0];
    return this.etoken2.setProxy(this.assetProxy.address, SYMBOL).then(() => {
      return this.assetProxy.allowance.call(holder, spender);
    }).then(result => {
      assert.equal(result.valueOf(), 0);
    });
  });
  it('should return 0 allowance for missing owner and missing spender', function() {
    const holder = accounts[1];
    const spender = accounts[2];
    return this.etoken2.setProxy(this.assetProxy.address, SYMBOL).then(() => {
      return this.assetProxy.allowance.call(holder, spender);
    }).then(result => {
      assert.equal(result.valueOf(), 0);
    });
  });
  it('should return 0 allowance for existing oneself', function() {
    const holder = accounts[0];
    const spender = holder;
    return this.etoken2.setProxy(this.assetProxy.address, SYMBOL).then(() => {
      return this.assetProxy.allowance.call(holder, spender);
    }).then(result => {
      assert.equal(result.valueOf(), 0);
    });
  });
  it('should return 0 allowance for missing oneself', function() {
    const holder = accounts[1];
    const spender = holder;
    return this.etoken2.setProxy(this.assetProxy.address, SYMBOL).then(() => {
      return this.assetProxy.allowance.call(holder, spender);
    }).then(result => {
      assert.equal(result.valueOf(), 0);
    });
  });
  it('should respect holder when telling allowance', function() {
    const holder = accounts[0];
    const holder2 = accounts[1];
    const spender = accounts[2];
    const value = 100;
    const value2 = 200;
    return this.etoken2.setProxy(this.assetProxy.address, SYMBOL).then(() => {
      return this.assetProxy.approve(spender, value);
    }).then(() => {
      return this.assetProxy.approve(spender, value2, {from: holder2});
    }).then(() => {
      return this.assetProxy.allowance.call(holder, spender);
    }).then(result => {
      assert.equal(result.valueOf(), value);
      return this.assetProxy.allowance.call(holder2, spender);
    }).then(result => {
      assert.equal(result.valueOf(), value2);
    });
  });
  it('should respect spender when telling allowance', function() {
    const holder = accounts[0];
    const spender = accounts[1];
    const spender2 = accounts[2];
    const value = 100;
    const value2 = 200;
    return this.etoken2.setProxy(this.assetProxy.address, SYMBOL).then(() => {
      return this.assetProxy.approve(spender, value);
    }).then(() => {
      return this.assetProxy.approve(spender2, value2);
    }).then(() => {
      return this.assetProxy.allowance.call(holder, spender);
    }).then(result => {
      assert.equal(result.valueOf(), value);
      return this.assetProxy.allowance.call(holder, spender2);
    }).then(result => {
      assert.equal(result.valueOf(), value2);
    });
  });
  it('should be possible to check allowance of existing owner and allowed existing spender', function() {
    const holder = accounts[0];
    const spender = accounts[1];
    const value = 300;
    return this.etoken2.setProxy(this.assetProxy.address, SYMBOL).then(() => {
      return this.assetProxy.transfer(spender, 100);
    }).then(() => {
      return this.assetProxy.approve(spender, value);
    }).then(() => {
      return this.assetProxy.allowance.call(holder, spender);
    }).then(result => {
      assert.equal(result.valueOf(), value);
    });
  });
  it('should be possible to check allowance of existing owner and allowed missing spender', function() {
    const holder = accounts[0];
    const spender = accounts[1];
    const value = 300;
    return this.etoken2.setProxy(this.assetProxy.address, SYMBOL).then(() => {
      return this.assetProxy.approve(spender, value);
    }).then(() => {
      return this.assetProxy.allowance.call(holder, spender);
    }).then(result => {
      assert.equal(result.valueOf(), value);
    });
  });
  it('should return 0 allowance after another transfer', function() {
    const holder = accounts[0];
    const spender = accounts[1];
    const value = 300;
    const resultValue = 0;
    return this.etoken2.setProxy(this.assetProxy.address, SYMBOL).then(() => {
      return this.assetProxy.approve(spender, value);
    }).then(() => {
      return this.assetProxy.transferFrom(holder, spender, value, {from: spender});
    }).then(() => {
      return this.assetProxy.allowance.call(holder, spender);
    }).then(result => {
      assert.equal(result.valueOf(), resultValue);
    });
  });
  it('should return 1 allowance after another transfer', function() {
    const holder = accounts[0];
    const spender = accounts[1];
    const receiver = accounts[2];
    const value = 300;
    const transfer = 299;
    const resultValue = 1;
    return this.etoken2.setProxy(this.assetProxy.address, SYMBOL).then(() => {
      return this.assetProxy.approve(spender, value);
    }).then(() => {
      return this.assetProxy.transferFrom(holder, receiver, transfer, {from: spender});
    }).then(() => {
      return this.assetProxy.allowance.call(holder, spender);
    }).then(result => {
      assert.equal(result.valueOf(), resultValue);
    });
  });
  it('should checkSigned on user if others not set', function() {
    let listener;
    return this.etoken2.setProxy(this.assetProxy.address, SYMBOL).then(() => {
      return this.Listener.deployed();
    }).then(instance => {
      listener = instance;
      return this.etoken2.setCosignerAddress(listener.address);
    }).then(() => {
      return this.assetProxy.transfer(accounts[1], 10);
    }).then(() => {
      return listener.calls();
    }).then(result => {
      assert.equal(result.valueOf(), 2);
    });
  });

  it('should be possible to disable proxy if not locked yet', function() {
    const holder = accounts[0];
    const holder2 = accounts[1];
    const balance2 = 100;
    return this.etoken2.setProxy(this.assetProxy.address, SYMBOL).then(() => {
      return this.etoken2.setProxy('0x0', SYMBOL);
    }).then(() => {
      return this.assetProxy.transfer(holder2, balance2);
    }).then(() => {
      return this.etoken2.balanceOf.call(holder2, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), 0);
      return this.etoken2.balanceOf.call(holder, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), VALUE);
    });
  });
  it('should be possible to transfer to ICAP', function() {
    const holder = accounts[0];
    const icapAddress = accounts[2];
    return this.etoken2.setProxy(this.assetProxy.address, SYMBOL).then(() => {
      return this.assetProxy.transferToICAP(ICAP, VALUE);
    }).then(() => {
      return this.etoken2.balanceOf.call(icapAddress, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), VALUE);
      return this.etoken2.balanceOf.call(holder, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), 0);
    });
  });
  it('should be possible to transfer to ICAP with reference', function() {
    const holder = accounts[0];
    const icapAddress = accounts[2];
    return this.etoken2.setProxy(this.assetProxy.address, SYMBOL).then(() => {
      return this.assetProxy.transferToICAPWithReference(ICAP, VALUE, "Ref");
    }).then(() => {
      return this.etoken2.balanceOf.call(icapAddress, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), VALUE);
      return this.etoken2.balanceOf.call(holder, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), 0);
    });
  });
  it('should be possible to transfer from to ICAP', function() {
    const holder = accounts[0];
    const icapAddress = accounts[2];
    return this.etoken2.setProxy(this.assetProxy.address, SYMBOL).then(() => {
      return this.assetProxy.approve(accounts[1], VALUE);
    }).then(() => {
      return this.assetProxy.transferFromToICAP(holder, ICAP, VALUE, {from: accounts[1]});
    }).then(() => {
      return this.etoken2.balanceOf.call(icapAddress, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), VALUE);
      return this.etoken2.balanceOf.call(holder, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), 0);
      return this.etoken2.allowance.call(holder, accounts[1], SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), 0);
    });
  });
  it('should be possible to transfer from to ICAP with reference', function() {
    const holder = accounts[0];
    const icapAddress = accounts[2];
    return this.etoken2.setProxy(this.assetProxy.address, SYMBOL).then(() => {
      return this.assetProxy.approve(accounts[1], VALUE);
    }).then(() => {
      return this.assetProxy.transferFromToICAPWithReference(holder, ICAP, VALUE, "Ref", {from: accounts[1]});
    }).then(() => {
      return this.etoken2.balanceOf.call(icapAddress, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), VALUE);
      return this.etoken2.balanceOf.call(holder, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), 0);
      return this.etoken2.allowance.call(holder, accounts[1], SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), 0);
    });
  });

  it('should be possible to do transfer from a contract', function() {
    let userContract;
    let holder;
    const holder2 = accounts[1];
    return this.etoken2.setProxy(this.assetProxy.address, SYMBOL).then(() => {
      return this.UserContract.deployed();
    }).then(instance => {
      userContract = instance;
      holder = userContract.address;
      return userContract.init(this.assetProxy.address);
    }).then(() => {
      userContract = this.SyncFab.at(userContract.address);
      return this.assetProxy.transfer(holder, VALUE);
    }).then(() => {
      return userContract.transfer(holder2, VALUE);
    }).then(() => {
      return this.etoken2.balanceOf.call(holder2, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), VALUE);
      return this.etoken2.balanceOf.call(holder, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), 0);
    });
  });
  it('should be possible to do transfer to ICAP from a contract', function() {
    let userContract;
    let holder;
    const icapAddress = accounts[2];
    return this.etoken2.setProxy(this.assetProxy.address, SYMBOL).then(() => {
      return this.UserContract.deployed();
    }).then(instance => {
      userContract = instance;
      holder = userContract.address;
      return userContract.init(this.assetProxy.address);
    }).then(() => {
      userContract = this.SyncFab.at(userContract.address);
      return this.assetProxy.transfer(holder, VALUE);
    }).then(() => {
      return userContract.transferToICAP(ICAP, VALUE);
    }).then(() => {
      return this.etoken2.balanceOf.call(icapAddress, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), VALUE);
      return this.etoken2.balanceOf.call(holder, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), 0);
    });
  });
  it('should be possible to approve from a contract', function() {
    let userContract;
    let holder;
    const holder2 = accounts[1];
    return this.etoken2.setProxy(this.assetProxy.address, SYMBOL).then(() => {
      return this.UserContract.deployed();
    }).then(instance => {
      userContract = instance;
      holder = userContract.address;
      return userContract.init(this.assetProxy.address);
    }).then(() => {
      userContract = this.SyncFab.at(userContract.address);
      return userContract.approve(holder2, VALUE);
    }).then(() => {
      return this.etoken2.allowance.call(holder, holder2, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), VALUE);
    });
  });
  it('should be possible to do allowance transfer from a contract', function() {
    let userContract;
    let holder;
    const owner = accounts[0];
    const holder2 = accounts[1];
    return this.etoken2.setProxy(this.assetProxy.address, SYMBOL).then(() => {
      return this.UserContract.deployed();
    }).then(instance => {
      userContract = instance;
      holder = userContract.address;
      return userContract.init(this.assetProxy.address);
    }).then(() => {
      userContract = this.SyncFab.at(userContract.address);
      return this.assetProxy.approve(holder, VALUE);
    }).then(() => {
      return userContract.transferFrom(owner, holder2, VALUE);
    }).then(() => {
      return this.etoken2.balanceOf.call(owner, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), 0);
      return this.etoken2.balanceOf.call(holder2, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), VALUE);
      return this.etoken2.balanceOf.call(holder, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), 0);
    });
  });
};
