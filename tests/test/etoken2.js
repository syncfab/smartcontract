const Reverter = require('./helpers/reverter');
const decodeLogs = require('./helpers/decodelogs');
const bytes32 = require('./helpers/bytes32');
const sha3 = require('./helpers/sha3');

const EToken2Testable = artifacts.require('./EToken2Testable.sol');
const EventsHistoryTestable = artifacts.require('./EventsHistoryTestable.sol');
const EToken2Emitter = artifacts.require('./EToken2Emitter.sol');
const RegistryICAPTestable = artifacts.require('./RegistryICAPTestable.sol');
const UserContract = artifacts.require('./UserContract.sol');

contract('EToken2', accounts => {
  const reverter = new Reverter(web3);
  afterEach('revert', reverter.revert);

  const UINT_256_MINUS_3 = '1.15792089237316195423570985008687907853269984665640564039457584007913129639933e+77';
  const UINT_256_MINUS_2 = '1.15792089237316195423570985008687907853269984665640564039457584007913129639934e+77';
  const UINT_256_MINUS_1 = '1.15792089237316195423570985008687907853269984665640564039457584007913129639935e+77';
  const UINT_256 = '1.15792089237316195423570985008687907853269984665640564039457584007913129639936e+77';
  const UINT_255_MINUS_1 = '5.7896044618658097711785492504343953926634992332820282019728792003956564819967e+76';
  const UINT_255 = '5.7896044618658097711785492504343953926634992332820282019728792003956564819968e+76';

  const BYTES_32 = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
  const BITS_257 = '0x10000000000000000000000000000000000000000000000000000000000000000';
  const ADDRESS_ZERO = '0x0000000000000000000000000000000000000000';

  const SYMBOL = bytes32(100);
  const NAME = 'Test Name';
  const DESCRIPTION = 'Test Description';
  const VALUE = 1001;
  const BASE_UNIT = 2;
  const IS_REISSUABLE = false;

  const Features = { Issue: 0, TransferWithReference: 1, Revoke: 2, ChangeOwnership: 3, Allowances: 4, ICAP: 5 };

  let etoken2;
  let eventsHistory;
  let userContract;

  before('setup', () => {
    return EToken2Testable.deployed().then(instance => {
      etoken2 = instance;
      return UserContract.deployed();
    }).then(instance => {
      userContract = EToken2Testable.at(etoken2.address);      
      return instance.init(etoken2.address);
    }).then(() => {
      return EventsHistoryTestable.deployed();
    }).then(instance => {
      eventsHistory = instance;
      return EToken2Emitter.deployed();
    }).then(etoken2Emitter => {
      const etoken2EmitterAbi = etoken2Emitter.contract;
      const fakeArgs = [0,0,0,0,0,0,0,0];
      return etoken2.setupEventsHistory(eventsHistory.address)
      .then(() => eventsHistory.addVersion(etoken2.address, 'Origin', 'Initial version.'))
      .then(() => eventsHistory.addEmitter(etoken2EmitterAbi.emitTransfer.getData.apply(this, fakeArgs).slice(0, 10), etoken2Emitter.address))
      .then(() => eventsHistory.addEmitter(etoken2EmitterAbi.emitTransferToICAP.getData.apply(this, fakeArgs).slice(0, 10), etoken2Emitter.address))
      .then(() => eventsHistory.addEmitter(etoken2EmitterAbi.emitIssue.getData.apply(this, fakeArgs).slice(0, 10), etoken2Emitter.address))
      .then(() => eventsHistory.addEmitter(etoken2EmitterAbi.emitRevoke.getData.apply(this, fakeArgs).slice(0, 10), etoken2Emitter.address))
      .then(() => eventsHistory.addEmitter(etoken2EmitterAbi.emitOwnershipChange.getData.apply(this, fakeArgs).slice(0, 10), etoken2Emitter.address))
      .then(() => eventsHistory.addEmitter(etoken2EmitterAbi.emitRecovery.getData.apply(this, fakeArgs).slice(0, 10), etoken2Emitter.address))
      .then(() => eventsHistory.addEmitter(etoken2EmitterAbi.emitApprove.getData.apply(this, fakeArgs).slice(0, 10), etoken2Emitter.address))
      .then(() => eventsHistory.addEmitter(etoken2EmitterAbi.emitError.getData.apply(this, fakeArgs).slice(0, 10), etoken2Emitter.address))
      .then(() => eventsHistory.addEmitter(etoken2EmitterAbi.emitChange.getData.apply(this, fakeArgs).slice(0, 10), etoken2Emitter.address))
      .then(() => eventsHistory = EToken2Emitter.at(eventsHistory.address));
    }).then(reverter.snapshot);
  });

  const getEvents = (tx, name = false) => decodeLogs(tx.receipt.logs, eventsHistory, web3).filter(log => !name || log.event === name);

  const assertError = tx => {
    const events = getEvents(tx);
    assert.equal(events.length, 1);
    assert.equal(events[0].event, 'Error');
    return true;
  };

  it('should not be possible to issue asset with existing symbol', () => {
    var symbol = SYMBOL;
    var value = 1001;
    var value2 = 3021;
    var name = 'Test Name';
    var name2 = '2Test Name2';
    var description = 'Test Description';
    var description2 = '2Test Description2';
    var baseUnit = 2;
    var baseUnit2 = 4;
    var isReissuable = false;
    var isReissuable2 = true;
    return etoken2.issueAsset(symbol, value, name, description, baseUnit, isReissuable).then(() => {
      return etoken2.issueAsset(symbol, value2, name2, description2, baseUnit2, isReissuable2);
    }).then(assertError).then(() => {
      return etoken2.name.call(symbol);
    }).then(result => {
      assert.equal(result.valueOf(), name);
      return etoken2.totalSupply.call(symbol);
    }).then(result => {
      assert.equal(result.valueOf(), value);
      return etoken2.description.call(symbol);
    }).then(result => {
      assert.equal(result.valueOf(), description);
      return etoken2.baseUnit.call(symbol);
    }).then(result => {
      assert.equal(result.valueOf(), baseUnit);
      return etoken2.isReissuable.call(symbol);
    }).then(result => {
      assert.equal(result.valueOf(), isReissuable);
    });
  });
  it('should be possible to issue asset with 1 bit 0 symbol', () => {
    var symbol = SYMBOL;
    return etoken2.issueAsset(symbol, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(() => {
      return etoken2.name.call(symbol);
    }).then(result => {
      assert.equal(result.valueOf(), NAME);
    });
  });
  it('should be possible to issue asset with 1 bit 1 symbol', () => {
    var symbol = bytes32(200);
    return etoken2.issueAsset(symbol, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(() => {
      return etoken2.name.call(symbol);
    }).then(result => {
      assert.equal(result.valueOf(), NAME);
    });
  });
  it('should be possible to issue asset with 32 bytes symbol', () => {
    var symbol = BYTES_32;
    return etoken2.issueAsset(symbol, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(() => {
      return etoken2.name.call(symbol);
    }).then(result => {
      assert.equal(result.valueOf(), NAME);
    });
  });
  it('should not be possible to issue fixed asset with 0 value', () => {
    var value = 0;
    var isReissuable = false;
    return etoken2.issueAsset(SYMBOL, value, NAME, DESCRIPTION, BASE_UNIT, isReissuable).then(() => {
      return etoken2.name.call(SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), '');
    });
  });
  it('should be possible to issue fixed asset with 1 value', () => {
    var value = 1;
    var isReissuable = false;
    return etoken2.issueAsset(SYMBOL, value, NAME, DESCRIPTION, BASE_UNIT, isReissuable).then(() => {
      return etoken2.totalSupply.call(SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), value);
    });
  });
  it('should be possible to issue fixed asset with (2**256 - 1) value', () => {
    var value = UINT_256_MINUS_1;
    var isReissuable = false;
    return etoken2.issueAsset(SYMBOL, value, NAME, DESCRIPTION, BASE_UNIT, isReissuable).then(() => {
      return etoken2.totalSupply.call(SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), value);
    });
  });
  it('should be possible to issue reissuable asset with 0 value', () => {
    var value = 0;
    var isReissuable = true;
    return etoken2.issueAsset(SYMBOL, value, NAME, DESCRIPTION, BASE_UNIT, isReissuable).then(() => {
      return etoken2.name.call(SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), NAME);
    });
  });
  it('should be possible to issue reissuable asset with 1 value', () => {
    var value = 1;
    var isReissuable = true;
    return etoken2.issueAsset(SYMBOL, value, NAME, DESCRIPTION, BASE_UNIT, isReissuable).then(() => {
      return etoken2.totalSupply.call(SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), value);
    });
  });
  it('should be possible to issue reissuable asset with (2**256 - 1) value', () => {
    var value = UINT_256_MINUS_1;
    var isReissuable = true;
    return etoken2.issueAsset(SYMBOL, value, NAME, DESCRIPTION, BASE_UNIT, isReissuable).then(() => {
      return etoken2.totalSupply.call(SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), value);
    });
  });
  it('should be possible to issue asset with base unit 1', () => {
    var baseUnit = 1;
    return etoken2.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, baseUnit, IS_REISSUABLE).then(() => {
      return etoken2.baseUnit.call(SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), 1);
    });
  });
  it('should be possible to issue asset with base unit 255', () => {
    var baseUnit = 255;
    return etoken2.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, baseUnit, IS_REISSUABLE).then(() => {
      return etoken2.baseUnit.call(SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), 255);
    });
  });
  it('should be possible to issue asset', () => {
    var symbol = SYMBOL;
    var value = 1001;
    var name = 'Test Name';
    var description = 'Test Description';
    var baseUnit = 2;
    var isReissuable = false;
    return etoken2.issueAsset(symbol, value, name, description, baseUnit, isReissuable).then(getEvents).then(events => {
      assert.equal(events.length, 1);
      assert.equal(events[0].args.symbol.valueOf(), symbol);
      assert.equal(events[0].args.value.valueOf(), value);
      assert.equal(events[0].args.by.valueOf(), accounts[0]);
      return etoken2.name.call(symbol);
    }).then(result => {
      assert.equal(result.valueOf(), name);
      return etoken2.totalSupply.call(symbol);
    }).then(result => {
      assert.equal(result.valueOf(), value);
      return etoken2.description.call(symbol);
    }).then(result => {
      assert.equal(result.valueOf(), description);
      return etoken2.baseUnit.call(symbol);
    }).then(result => {
      assert.equal(result.valueOf(), baseUnit);
      return etoken2.isReissuable.call(symbol);
    }).then(result => {
      assert.equal(result.valueOf(), isReissuable);
    });
  });
  it('should be possible to issue multiple assets', () => {
    var symbol = SYMBOL;
    var symbol2 = bytes32(200);
    var owner = accounts[0];
    var value = 1001;
    var value2 = 3021;
    var name = 'Test Name';
    var name2 = '2Test Name2';
    var description = 'Test Description';
    var description2 = '2Test Description2';
    var baseUnit = 2;
    var baseUnit2 = 4;
    var isReissuable = false;
    var isReissuable2 = true;
    return etoken2.issueAsset(symbol, value, name, description, baseUnit, isReissuable).then(() => {
      return etoken2.issueAsset(symbol2, value2, name2, description2, baseUnit2, isReissuable2);
    }).then(() => {
      return etoken2.name.call(symbol);
    }).then(result => {
      assert.equal(result.valueOf(), name);
      return etoken2.name.call(symbol2);
    }).then(result => {
      assert.equal(result.valueOf(), name2);
      return etoken2.totalSupply.call(symbol);
    }).then(result => {
      assert.equal(result.valueOf(), value);
      return etoken2.totalSupply.call(symbol2);
    }).then(result => {
      assert.equal(result.valueOf(), value2);
      return etoken2.description.call(symbol);
    }).then(result => {
      assert.equal(result.valueOf(), description);
      return etoken2.description.call(symbol2);
    }).then(result => {
      assert.equal(result.valueOf(), description2);
      return etoken2.baseUnit.call(symbol);
    }).then(result => {
      assert.equal(result.valueOf(), baseUnit);
      return etoken2.baseUnit.call(symbol2);
    }).then(result => {
      assert.equal(result.valueOf(), baseUnit2);
      return etoken2.isReissuable.call(symbol);
    }).then(result => {
      assert.equal(result.valueOf(), isReissuable);
      return etoken2.isReissuable.call(symbol2);
    }).then(result => {
      assert.equal(result.valueOf(), isReissuable2);
      return etoken2.owner.call(symbol);
    }).then(result => {
      assert.equal(result.valueOf(), owner);
      return etoken2.owner.call(symbol2);
    }).then(result => {
      assert.equal(result.valueOf(), owner);
    });
  });
  it('should be possible to get asset name', () => {
    return etoken2.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(() => {
      return etoken2.name.call(SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), NAME);
    });
  });
  it('should be possible to get asset description', () => {
    return etoken2.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(() => {
      return etoken2.description.call(SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), DESCRIPTION);
    });
  });
  it('should be possible to get asset base unit', () => {
    return etoken2.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(() => {
      return etoken2.baseUnit.call(SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), BASE_UNIT);
    });
  });
  it('should be possible to get asset reissuability', () => {
    var isReissuable = true;
    return etoken2.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, isReissuable).then(() => {
      return etoken2.isReissuable.call(SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), isReissuable);
    });
  });
  it('should be possible to get asset owner', () => {
    return etoken2.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(() => {
      return etoken2.owner.call(SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), accounts[0]);
    });
  });
  it('should be possible to check if address is asset owner', () => {
    return etoken2.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(() => {
      return etoken2.isOwner.call(accounts[0], SYMBOL);
    }).then(result => {
      assert.isTrue(result.valueOf());
    });
  });
  it('should be possible to check if address is owner of non-existing asset', () => {
    return etoken2.isOwner.call(accounts[0], SYMBOL).then(result => {
      assert.isFalse(result.valueOf());
    });
  });
  it('should be possible to check if asset is created', () => {
    return etoken2.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(() => {
      return etoken2.isCreated.call(SYMBOL);
    }).then(result => {
      assert.isTrue(result.valueOf());
    });
  });
  it('should be possible to check if asset is created for non-existing asset', () => {
    return etoken2.isCreated.call(SYMBOL).then(result => {
      assert.isFalse(result.valueOf());
    });
  });
  it('should be possible to get asset total supply with single holder', () => {
    return etoken2.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(() => {
      return etoken2.totalSupply.call(SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), VALUE);
    });
  });
  it('should be possible to get asset total supply with multiple holders', () => {
    var amount = 1001;
    var amount2 = 999;
    var holder2 = accounts[1];
    return etoken2.issueAsset(SYMBOL, amount + amount2, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(() => {
      return etoken2.transfer(holder2, amount2, SYMBOL);
    }).then(() => {
      return etoken2.totalSupply.call(SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), amount + amount2);
    });
  });
  it('should be possible to get asset total supply with multiple holders holding 0 amount', () => {
    var holder = accounts[0];
    var holder2 = accounts[1];
    return etoken2.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(() => {
      return etoken2.transfer(holder2, VALUE, SYMBOL);
    }).then(() => {
      return etoken2.transfer(holder, VALUE, SYMBOL, {from: holder2});
    }).then(() => {
      return etoken2.revokeAsset(SYMBOL, VALUE);
    }).then(() => {
      return etoken2.totalSupply.call(SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), 0);
    });
  });
  it('should be possible to get asset total supply with multiple holders holding (2**256 - 1) amount', () => {
    var value = UINT_256_MINUS_1;
    var holder = accounts[0];
    var holder2 = accounts[1];
    return etoken2.issueAsset(SYMBOL, value, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(() => {
      return etoken2.transfer(holder2, 10, SYMBOL);
    }).then(() => {
      return etoken2.totalSupply.call(SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), value);
    });
  });
  it('should be possible to get asset balance for holder', () => {
    var owner = accounts[0];
    var symbol2 = bytes32(10);
    return etoken2.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(() => {
      return etoken2.issueAsset(symbol2, VALUE-10, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE);
    }).then(() => {
      return etoken2.balanceOf.call(owner, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), VALUE);
    });
  });
  it('should be possible to get asset balance for non owner', () => {
    var owner = accounts[0];
    var nonOwner = accounts[1];
    var amount = 100;
    return etoken2.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(() => {
      return etoken2.transfer(nonOwner, amount, SYMBOL);
    }).then(() => {
      return etoken2.balanceOf.call(nonOwner, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), amount);
    });
  });
  it('should be possible to get asset balance for missing holder', () => {
    var nonOwner = accounts[1];
    return etoken2.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(() => {
      return etoken2.balanceOf.call(nonOwner, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), 0);
    });
  });
  it('should be possible to get missing asset balance for holder', () => {
    var nonAsset = 'LHNONEXIST';
    var owner = accounts[0];
    return etoken2.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(() => {
      return etoken2.balanceOf.call(owner, nonAsset);
    }).then(result => {
      assert.equal(result.valueOf(), 0);
    });
  });
  it('should be possible to get missing asset balance for missing holder', () => {
    var nonAsset = 'LHNONEXIST';
    var nonOwner = accounts[1];
    return etoken2.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(() => {
      return etoken2.balanceOf.call(nonOwner, nonAsset);
    }).then(result => {
      assert.equal(result.valueOf(), 0);
    });
  });
  it('should not be possible to get name of missing asset', () => {
    var nonAsset = 'LHNONEXIST';
    return etoken2.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(() => {
      return etoken2.name.call(nonAsset);
    }).then(result => {
      assert.equal(result.valueOf(), '');
    });
  });
  it('should not be possible to get description of missing asset', () => {
    var nonAsset = 'LHNONEXIST';
    return etoken2.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(() => {
      return etoken2.description.call(nonAsset);
    }).then(result => {
      assert.equal(result.valueOf(), '');
    });
  });
  it('should not be possible to get base unit of missing asset', () => {
    var nonAsset = 'LHNONEXIST';
    return etoken2.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(() => {
      return etoken2.baseUnit.call(nonAsset);
    }).then(result => {
      assert.equal(result.valueOf(), 0);
    });
  });
  it('should not be possible to get reissuability of missing asset', () => {
    var nonAsset = 'LHNONEXIST';
    var isReissuable = true;
    return etoken2.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, isReissuable).then(() => {
      return etoken2.isReissuable.call(nonAsset);
    }).then(result => {
      assert.isFalse(result);
    });
  });
  it('should not be possible to get owner of missing asset', () => {
    var nonAsset = 'LHNONEXIST';
    return etoken2.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(() => {
      return etoken2.owner.call(nonAsset);
    }).then(result => {
      assert.equal(result.valueOf(), ADDRESS_ZERO);
    });
  });
  it('should not be possible to get total supply of missing asset', () => {
    return etoken2.totalSupply.call(SYMBOL).then(result => {
      assert.equal(result.valueOf(), 0);
    });
  });
  it('should not be possible to change ownership by non-owner', () => {
    var owner = accounts[0];
    var nonOwner = accounts[1];
    return etoken2.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(() => {
      return etoken2.changeOwnership(SYMBOL, nonOwner, {from: nonOwner});
    }).then(() => {
      return etoken2.owner.call(SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), owner);
    });
  });
  it('should not be possible to change ownership to the same owner', () => {
    var owner = accounts[0];
    return etoken2.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(() => {
      return etoken2.changeOwnership(SYMBOL, owner);
    }).then(assertError).then(() => {
      return etoken2.owner.call(SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), owner);
    });
  });
  it('should not be possible to change ownership of missing asset', () => {
    var owner = accounts[0];
    var nonOwner = accounts[1];
    var nonAsset = 'LHNONEXIST';
    return etoken2.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(() => {
      return etoken2.changeOwnership(nonAsset, nonOwner);
    }).then(() => {
      return etoken2.owner.call(SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), owner);
      return etoken2.owner.call(nonAsset);
    }).then(result => {
      assert.equal(result.valueOf(), ADDRESS_ZERO);
    });
  });
  it('should be possible to change ownership of asset', () => {
    var owner = accounts[0];
    var newOwner = accounts[1];
    return etoken2.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(() => {
      return etoken2.changeOwnership(SYMBOL, newOwner);
    }).then(getEvents).then(events => {
      assert.equal(events.length, 1);
      assert.equal(events[0].args.from.valueOf(), owner);
      assert.equal(events[0].args.to.valueOf(), newOwner);
      assert.equal(events[0].args.symbol.valueOf(), SYMBOL);
      return etoken2.owner.call(SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), newOwner);
    });
  });
  it('should be possible to reissue after ownership change', () => {
    var owner = accounts[0];
    var newOwner = accounts[1];
    var isReissuable = true;
    var amount = 100;
    return etoken2.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, isReissuable).then(() => {
      return etoken2.changeOwnership(SYMBOL, newOwner);
    }).then(() => {
      return etoken2.reissueAsset(SYMBOL, amount, {from: newOwner});
    }).then(() => {
      return etoken2.totalSupply.call(SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), VALUE + amount);
      return etoken2.balanceOf.call(owner, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), VALUE);
      return etoken2.balanceOf.call(newOwner, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), amount);
    });
  });
  it('should be possible to revoke after ownership change to missing account', () => {
    var owner = accounts[0];
    var newOwner = accounts[1];
    var amount = 100;
    return etoken2.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(() => {
      return etoken2.changeOwnership(SYMBOL, newOwner);
    }).then(() => {
      return etoken2.transfer(newOwner, amount, SYMBOL);
    }).then(() => {
      return etoken2.revokeAsset(SYMBOL, amount, {from: newOwner});
    }).then(() => {
      return etoken2.totalSupply.call(SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), VALUE - amount);
      return etoken2.balanceOf.call(owner, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), VALUE - amount);
      return etoken2.balanceOf.call(newOwner, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), 0);
    });
  });
  it('should be possible to revoke after ownership change to existing account', () => {
    var owner = accounts[0];
    var newOwner = accounts[1];
    var amount = 100;
    return etoken2.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(() => {
      return etoken2.transfer(newOwner, amount, SYMBOL);
    }).then(() => {
      return etoken2.changeOwnership(SYMBOL, newOwner);
    }).then(() => {
      return etoken2.revokeAsset(SYMBOL, amount, {from: newOwner});
    }).then(() => {
      return etoken2.totalSupply.call(SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), VALUE - amount);
      return etoken2.balanceOf.call(owner, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), VALUE - amount);
      return etoken2.balanceOf.call(newOwner, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), 0);
    });
  });
  it('should keep ownership change separated between assets', () => {
    var owner = accounts[0];
    var newOwner = accounts[1];
    var symbol2 = bytes32(10);
    return etoken2.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(() => {
      return etoken2.issueAsset(symbol2, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE);
    }).then(() => {
      return etoken2.changeOwnership(SYMBOL, newOwner);
    }).then(() => {
      return etoken2.owner.call(SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), newOwner);
      return etoken2.owner.call(symbol2);
    }).then(result => {
      assert.equal(result.valueOf(), owner);
    });
  });
  it('should not be possible to transfer missing asset', () => {
    var owner = accounts[0];
    var nonOwner = accounts[1];
    var amount = 100;
    var nonAsset = 'LHNONEXIST';
    return etoken2.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(() => {
      return etoken2.transfer(nonOwner, amount, nonAsset);
    }).then(() => {
      return etoken2.balanceOf.call(nonOwner, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), 0);
      return etoken2.balanceOf.call(nonOwner, nonAsset);
    }).then(result => {
      assert.equal(result.valueOf(), 0);
      return etoken2.balanceOf.call(owner, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), VALUE);
      return etoken2.balanceOf.call(owner, nonAsset);
    }).then(result => {
      assert.equal(result.valueOf(), 0);
    });
  });
  it('should not be possible to transfer amount 1 with balance 0', () => {
    var owner = accounts[0];
    var nonOwner = accounts[1];
    var amount = 1;
    return etoken2.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(() => {
      return etoken2.transfer(nonOwner, VALUE, SYMBOL);
    }).then(() => {
      return etoken2.transfer(nonOwner, amount, SYMBOL);
    }).then(() => {
      return etoken2.balanceOf.call(nonOwner, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), VALUE);
      return etoken2.balanceOf.call(owner, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), 0);
    });
  });
  it('should not be possible to transfer amount 2 with balance 1', () => {
    var owner = accounts[0];
    var nonOwner = accounts[1];
    var value = 1;
    var amount = 2;
    return etoken2.issueAsset(SYMBOL, value, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(() => {
      return etoken2.transfer(nonOwner, amount, SYMBOL);
    }).then(() => {
      return etoken2.balanceOf.call(nonOwner, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), 0);
      return etoken2.balanceOf.call(owner, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), value);
    });
  });
  it('should not be possible to transfer amount (2**256 - 1) with balance (2**256 - 2)', () => {
    var owner = accounts[0];
    var nonOwner = accounts[1];
    var value = UINT_256_MINUS_2;
    var amount = UINT_256_MINUS_1;
    return etoken2.issueAsset(SYMBOL, value, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(() => {
      return etoken2.transfer(nonOwner, amount, SYMBOL);
    }).then(() => {
      return etoken2.balanceOf.call(nonOwner, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), 0);
      return etoken2.balanceOf.call(owner, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), value);
    });
  });
  it('should not be possible to transfer amount 0', () => {
    var owner = accounts[0];
    var nonOwner = accounts[1];
    var amount = 0;
    return etoken2.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(() => {
      return etoken2.transfer(nonOwner, amount, SYMBOL);
    }).then(assertError).then(() => {
      return etoken2.balanceOf.call(nonOwner, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), 0);
      return etoken2.balanceOf.call(owner, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), VALUE);
    });
  });
  it('should not be possible to transfer to oneself', () => {
    var owner = accounts[0];
    var amount = 100;
    return etoken2.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(() => {
      return etoken2.transfer(owner, amount, SYMBOL);
    }).then(assertError).then(() => {
      return etoken2.balanceOf.call(owner, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), VALUE);
      return etoken2.balanceOf.call(owner, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), VALUE);
    });
  });
  it('should not be possible to transfer amount (2**256 - 1) to holder with 1 balance', () => {
    // Situation is impossible due to impossibility to issue more than (2**256 - 1) tokens for the asset.
  });
  it('should not be possible to transfer amount 1 to holder with (2**256 - 1) balance', () => {
    // Situation is impossible due to impossibility to issue more than (2**256 - 1) tokens for the asset.
  });
  it('should not be possible to transfer amount 2**255 to holder with 2**255 balance', () => {
    // Situation is impossible due to impossibility to issue more than (2**256 - 1) tokens for the asset.
  });
  it('should be possible to transfer amount 2**255 to holder with (2**255 - 1) balance', () => {
    var holder = accounts[0];
    var holder2 = accounts[1];
    var value = UINT_256_MINUS_1;
    var amount = UINT_255;
    var balance2 = UINT_255_MINUS_1;
    return etoken2.issueAsset(SYMBOL, value, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(() => {
      return etoken2.transfer(holder2, balance2, SYMBOL);
    }).then(() => {
      return etoken2.transfer(holder2, amount, SYMBOL);
    }).then(() => {
      return etoken2.balanceOf.call(holder2, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), value);
      return etoken2.balanceOf.call(holder, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), 0);
    });
  });
  it('should be possible to transfer amount (2**255 - 1) to holder with 2**255 balance', () => {
    var holder = accounts[0];
    var holder2 = accounts[1];
    var value = UINT_256_MINUS_1;
    var amount = UINT_255_MINUS_1;
    var balance2 = UINT_255;
    return etoken2.issueAsset(SYMBOL, value, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(() => {
      return etoken2.transfer(holder2, balance2, SYMBOL);
    }).then(() => {
      return etoken2.transfer(holder2, amount, SYMBOL);
    }).then(() => {
      return etoken2.balanceOf.call(holder2, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), value);
      return etoken2.balanceOf.call(holder, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), 0);
    });
  });
  it('should be possible to transfer amount (2**256 - 2) to holder with 1 balance', () => {
    var holder = accounts[0];
    var holder2 = accounts[1];
    var value = UINT_256_MINUS_1;
    var amount = UINT_256_MINUS_2;
    var balance2 = 1;
    return etoken2.issueAsset(SYMBOL, value, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(() => {
      return etoken2.transfer(holder2, balance2, SYMBOL);
    }).then(() => {
      return etoken2.transfer(holder2, amount, SYMBOL);
    }).then(() => {
      return etoken2.balanceOf.call(holder2, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), value);
      return etoken2.balanceOf.call(holder, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), 0);
    });
  });
  it('should be possible to transfer amount 1 to holder with (2**256 - 2) balance', () => {
    var holder = accounts[0];
    var holder2 = accounts[1];
    var value = UINT_256_MINUS_1;
    var amount = 1;
    var balance2 = UINT_256_MINUS_2;
    return etoken2.issueAsset(SYMBOL, value, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(() => {
      return etoken2.transfer(holder2, balance2, SYMBOL);
    }).then(() => {
      return etoken2.transfer(holder2, amount, SYMBOL);
    }).then(() => {
      return etoken2.balanceOf.call(holder2, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), value);
      return etoken2.balanceOf.call(holder, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), 0);
    });
  });
  it('should be possible to transfer amount 1 to existing holder with 0 balance', () => {
    var holder = accounts[0];
    var holder2 = accounts[1];
    var amount = 1;
    return etoken2.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(() => {
      return etoken2.transfer(holder2, VALUE, SYMBOL);
    }).then(() => {
      return etoken2.transfer(holder, amount, SYMBOL, {from: holder2});
    }).then(() => {
      return etoken2.balanceOf.call(holder2, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), VALUE - amount);
      return etoken2.balanceOf.call(holder, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), amount);
    });
  });
  it('should be possible to transfer amount 1 to missing holder', () => {
    var holder = accounts[0];
    var holder2 = accounts[1];
    var amount = 1;
    return etoken2.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(() => {
      return etoken2.transfer(holder2, amount, SYMBOL);
    }).then(() => {
      return etoken2.balanceOf.call(holder2, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), amount);
      return etoken2.balanceOf.call(holder, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), VALUE - amount);
    });
  });
  it('should be possible to transfer amount 1 to holder with non-zero balance', () => {
    var holder = accounts[0];
    var holder2 = accounts[1];
    var balance2 = 100;
    var amount = 1;
    return etoken2.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(() => {
      return etoken2.transfer(holder2, balance2, SYMBOL);
    }).then(() => {
      return etoken2.transfer(holder2, amount, SYMBOL);
    }).then(() => {
      return etoken2.balanceOf.call(holder2, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), balance2 + amount);
      return etoken2.balanceOf.call(holder, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), VALUE - balance2 - amount);
    });
  });
  it('should be possible to transfer amount (2**256 - 1) to existing holder with 0 balance', () => {
    var holder = accounts[0];
    var holder2 = accounts[1];
    var amount = UINT_256_MINUS_1;
    return etoken2.issueAsset(SYMBOL, amount, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(() => {
      return etoken2.transfer(holder2, amount, SYMBOL);
    }).then(() => {
      return etoken2.transfer(holder, amount, SYMBOL, {from: holder2});
    }).then(() => {
      return etoken2.balanceOf.call(holder2, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), 0);
      return etoken2.balanceOf.call(holder, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), amount);
    });
  });
  it('should be possible to transfer amount (2**256 - 1) to missing holder', () => {
    var holder = accounts[0];
    var holder2 = accounts[1];
    var amount = UINT_256_MINUS_1;
    return etoken2.issueAsset(SYMBOL, amount, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(() => {
      return etoken2.transfer(holder2, amount, SYMBOL);
    }).then(() => {
      return etoken2.balanceOf.call(holder2, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), amount);
      return etoken2.balanceOf.call(holder, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), 0);
    });
  });
  it('should keep transfers separated between assets', () => {
    var symbol = SYMBOL;
    var symbol2 = bytes32(200);
    var value = 500;
    var value2 = 1000;
    var holder = accounts[0];
    var holder2 = accounts[1];
    var amount = 100;
    var amount2 = 33;
    return etoken2.issueAsset(symbol, value, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(() => {
      return etoken2.issueAsset(symbol2, value2, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE);
    }).then(() => {
      return etoken2.transfer(holder2, amount, symbol);
    }).then(getEvents).then(events => {
      assert.equal(events.length, 1);
      assert.equal(events[0].args.from.valueOf(), holder);
      assert.equal(events[0].args.to.valueOf(), holder2);
      assert.equal(events[0].args.symbol.valueOf(), symbol);
      assert.equal(events[0].args.value.valueOf(), amount);
      assert.equal(events[0].args.reference.valueOf(), '');
      return etoken2.transfer(holder2, amount2, symbol2);
    }).then(getEvents).then(events => {
      assert.equal(events.length, 1);
      assert.equal(events[0].args.from.valueOf(), holder);
      assert.equal(events[0].args.to.valueOf(), holder2);
      assert.equal(events[0].args.symbol.valueOf(), symbol2);
      assert.equal(events[0].args.value.valueOf(), amount2);
      assert.equal(events[0].args.reference.valueOf(), '');
      return etoken2.balanceOf.call(holder, symbol);
    }).then(result => {
      assert.equal(result.valueOf(), value - amount);
      return etoken2.balanceOf.call(holder2, symbol);
    }).then(result => {
      assert.equal(result.valueOf(), amount);
      return etoken2.balanceOf.call(holder, symbol2);
    }).then(result => {
      assert.equal(result.valueOf(), value2 - amount2);
      return etoken2.balanceOf.call(holder2, symbol2);
    }).then(result => {
      assert.equal(result.valueOf(), amount2);
    });
  });
  it('should be possible to do transfer with reference', () => {
    var holder = accounts[0];
    var holder2 = accounts[1];
    var reference = 'Invoice#AS001';
    return etoken2.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(() => {
      return etoken2.transferWithReference(holder2, VALUE, SYMBOL, reference);
    }).then(getEvents).then(events => {
      assert.equal(events.length, 1);
      assert.equal(events[0].args.from.valueOf(), holder);
      assert.equal(events[0].args.to.valueOf(), holder2);
      assert.equal(events[0].args.symbol.valueOf(), SYMBOL);
      assert.equal(events[0].args.value.valueOf(), VALUE);
      assert.equal(events[0].args.reference.valueOf(), reference);
      return etoken2.balanceOf.call(holder2, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), VALUE);
      return etoken2.balanceOf.call(holder, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), 0);
    });
  });
  it('should not be possible to reissue asset by non-owner', () => {
    var owner = accounts[0];
    var nonOwner = accounts[1];
    var isReissuable = true;
    return etoken2.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, isReissuable).then(() => {
      return etoken2.reissueAsset(SYMBOL, 100, {from: nonOwner});
    }).then(() => {
      return etoken2.balanceOf.call(owner, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), VALUE);
      return etoken2.balanceOf.call(nonOwner, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), 0);
      return etoken2.totalSupply.call(SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), VALUE);
    });
  });
  it('should not be possible to reissue fixed asset', () => {
    var owner = accounts[0];
    var isReissuable = false;
    return etoken2.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, isReissuable).then(() => {
      return etoken2.reissueAsset(SYMBOL, 100);
    }).then(() => {
      return etoken2.balanceOf.call(owner, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), VALUE);
      return etoken2.totalSupply.call(SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), VALUE);
    });
  });
  it('should not be possible to reissue 0 of reissuable asset', () => {
    var owner = accounts[0];
    var isReissuable = true;
    var amount = 0;
    return etoken2.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, isReissuable).then(() => {
      return etoken2.reissueAsset(SYMBOL, amount);
    }).then(assertError).then(() => {
      return etoken2.balanceOf.call(owner, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), VALUE);
      return etoken2.totalSupply.call(SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), VALUE);
    });
  });
  it('should not be possible to reissue missing asset', () => {
    var owner = accounts[0];
    var isReissuable = true;
    var nonAsset = 'LHNONEXIST';
    return etoken2.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, isReissuable).then(() => {
      return etoken2.reissueAsset(nonAsset, 100);
    }).then(() => {
      return etoken2.balanceOf.call(owner, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), VALUE);
      return etoken2.totalSupply.call(SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), VALUE);
      return etoken2.balanceOf.call(owner, nonAsset);
    }).then(result => {
      assert.equal(result.valueOf(), 0);
      return etoken2.totalSupply.call(nonAsset);
    }).then(result => {
      assert.equal(result.valueOf(), 0);
    });
  });
  it('should not be possible to reissue 1 with total supply (2**256 - 1)', () => {
    var owner = accounts[0];
    var value = UINT_256_MINUS_1;
    var isReissuable = true;
    var amount = 1;
    return etoken2.issueAsset(SYMBOL, value, NAME, DESCRIPTION, BASE_UNIT, isReissuable).then(() => {
      return etoken2.reissueAsset(SYMBOL, amount);
    }).then(assertError).then(() => {
      return etoken2.balanceOf.call(owner, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), value);
      return etoken2.totalSupply.call(SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), value);
    });
  });
  it('should not be possible to reissue (2**256 - 1) with total supply 1', () => {
    var owner = accounts[0];
    var value = 1;
    var isReissuable = true;
    var amount = UINT_256_MINUS_1;
    return etoken2.issueAsset(SYMBOL, value, NAME, DESCRIPTION, BASE_UNIT, isReissuable).then(() => {
      return etoken2.reissueAsset(SYMBOL, amount);
    }).then(assertError).then(() => {
      return etoken2.balanceOf.call(owner, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), value);
      return etoken2.totalSupply.call(SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), value);
    });
  });
  it('should be possible to reissue 1 with total supply (2**256 - 2)', () => {
    var owner = accounts[0];
    var value = UINT_256_MINUS_2;
    var isReissuable = true;
    var amount = 1;
    var resultValue = UINT_256_MINUS_1;
    return etoken2.issueAsset(SYMBOL, value, NAME, DESCRIPTION, BASE_UNIT, isReissuable).then(() => {
      return etoken2.reissueAsset(SYMBOL, amount);
    }).then(() => {
      return etoken2.balanceOf.call(owner, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), resultValue);
      return etoken2.totalSupply.call(SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), resultValue);
    });
  });
  it('should be possible to reissue 1 with total supply 0', () => {
    var owner = accounts[0];
    var value = 0;
    var isReissuable = true;
    var amount = 1;
    return etoken2.issueAsset(SYMBOL, value, NAME, DESCRIPTION, BASE_UNIT, isReissuable).then(() => {
      return etoken2.reissueAsset(SYMBOL, amount);
    }).then(() => {
      return etoken2.balanceOf.call(owner, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), value + amount);
      return etoken2.totalSupply.call(SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), value + amount);
    });
  });
  it('should be possible to reissue (2**256 - 1) with total supply 0', () => {
    var owner = accounts[0];
    var value = 0;
    var isReissuable = true;
    var amount = UINT_256_MINUS_1;
    return etoken2.issueAsset(SYMBOL, value, NAME, DESCRIPTION, BASE_UNIT, isReissuable).then(() => {
      return etoken2.reissueAsset(SYMBOL, amount);
    }).then(() => {
      return etoken2.balanceOf.call(owner, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), amount);
      return etoken2.totalSupply.call(SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), amount);
    });
  });
  it('should be possible to reissue (2**256 - 2) with total supply 1', () => {
    var owner = accounts[0];
    var value = 1;
    var isReissuable = true;
    var amount = UINT_256_MINUS_2;
    var resultValue = UINT_256_MINUS_1;
    return etoken2.issueAsset(SYMBOL, value, NAME, DESCRIPTION, BASE_UNIT, isReissuable).then(() => {
      return etoken2.reissueAsset(SYMBOL, amount);
    }).then(() => {
      return etoken2.balanceOf.call(owner, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), resultValue);
      return etoken2.totalSupply.call(SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), resultValue);
    });
  });
  it('should be possible to reissue (2**255 - 1) with total supply 2**255', () => {
    var owner = accounts[0];
    var value = UINT_255;
    var isReissuable = true;
    var amount = UINT_255_MINUS_1;
    var resultValue = UINT_256_MINUS_1;
    return etoken2.issueAsset(SYMBOL, value, NAME, DESCRIPTION, BASE_UNIT, isReissuable).then(() => {
      return etoken2.reissueAsset(SYMBOL, amount);
    }).then(() => {
      return etoken2.balanceOf.call(owner, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), resultValue);
      return etoken2.totalSupply.call(SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), resultValue);
    });
  });
  it('should be possible to reissue 2**255 with total supply (2**255 - 1)', () => {
    var owner = accounts[0];
    var value = UINT_255_MINUS_1;
    var isReissuable = true;
    var amount = UINT_255;
    var resultValue = UINT_256_MINUS_1;
    return etoken2.issueAsset(SYMBOL, value, NAME, DESCRIPTION, BASE_UNIT, isReissuable).then(() => {
      return etoken2.reissueAsset(SYMBOL, amount);
    }).then(() => {
      return etoken2.balanceOf.call(owner, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), resultValue);
      return etoken2.totalSupply.call(SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), resultValue);
    });
  });
  it('should keep reissuance separated between assets', () => {
    var symbol = SYMBOL;
    var symbol2 = bytes32(200);
    var value = 500;
    var value2 = 1000;
    var holder = accounts[0];
    var amount = 100;
    var amount2 = 33;
    var isReissuable = true;
    return etoken2.issueAsset(symbol, value, NAME, DESCRIPTION, BASE_UNIT, isReissuable).then(() => {
      return etoken2.issueAsset(symbol2, value2, NAME, DESCRIPTION, BASE_UNIT, isReissuable);
    }).then(() => {
      return etoken2.reissueAsset(symbol, amount);
    }).then(() => {
      return etoken2.reissueAsset(symbol2, amount2);
    }).then(() => {
      return etoken2.balanceOf.call(holder, symbol);
    }).then(result => {
      assert.equal(result.valueOf(), value + amount);
      return etoken2.totalSupply.call(symbol);
    }).then(result => {
      assert.equal(result.valueOf(), value + amount);
      return etoken2.balanceOf.call(holder, symbol2);
    }).then(result => {
      assert.equal(result.valueOf(), value2 + amount2);
      return etoken2.totalSupply.call(symbol2);
    }).then(result => {
      assert.equal(result.valueOf(), value2 + amount2);
    });
  });
  it('should not be possible to revoke 1 from missing asset', () => {
    var owner = accounts[0];
    var amount = 1;
    var nonAsset = 'LHNONEXIST';
    return etoken2.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(() => {
      return etoken2.revokeAsset(nonAsset, amount);
    }).then(() => {
      return etoken2.balanceOf.call(owner, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), VALUE);
      return etoken2.totalSupply.call(SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), VALUE);
      return etoken2.balanceOf.call(owner, nonAsset);
    }).then(result => {
      assert.equal(result.valueOf(), 0);
    });
  });
  it('should not be possible to revoke 0 from fixed asset', () => {
    var owner = accounts[0];
    var amount = 0;
    var isReissuable = false;
    return etoken2.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, isReissuable).then(() => {
      return etoken2.revokeAsset(SYMBOL, amount);
    }).then(assertError).then(() => {
      return etoken2.balanceOf.call(owner, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), VALUE);
      return etoken2.totalSupply.call(SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), VALUE);
    });
  });
  it('should not be possible to revoke 0 from reissuable asset', () => {
    var owner = accounts[0];
    var amount = 0;
    var isReissuable = true;
    return etoken2.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, isReissuable).then(() => {
      return etoken2.revokeAsset(SYMBOL, amount);
    }).then(assertError).then(() => {
      return etoken2.balanceOf.call(owner, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), VALUE);
      return etoken2.totalSupply.call(SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), VALUE);
    });
  });
  it('should not be possible to revoke 1 with balance 0', () => {
    var owner = accounts[0];
    var value = 0;
    var amount = 1;
    var isReissuable = true;
    return etoken2.issueAsset(SYMBOL, value, NAME, DESCRIPTION, BASE_UNIT, isReissuable).then(() => {
      return etoken2.revokeAsset(SYMBOL, amount);
    }).then(assertError).then(() => {
      return etoken2.balanceOf.call(owner, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), value);
      return etoken2.totalSupply.call(SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), value);
    });
  });
  it('should not be possible to revoke 2 with balance 1', () => {
    var owner = accounts[0];
    var value = 1;
    var amount = 2;
    return etoken2.issueAsset(SYMBOL, value, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(() => {
      return etoken2.revokeAsset(SYMBOL, amount);
    }).then(assertError).then(() => {
      return etoken2.balanceOf.call(owner, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), value);
      return etoken2.totalSupply.call(SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), value);
    });
  });
  it('should not be possible to revoke (2**256 - 1) with balance (2**256 - 2)', () => {
    var owner = accounts[0];
    var value = UINT_256_MINUS_2;
    var amount = UINT_256_MINUS_1;
    var isReissuable = true;
    return etoken2.issueAsset(SYMBOL, value, NAME, DESCRIPTION, BASE_UNIT, isReissuable).then(() => {
      return etoken2.revokeAsset(SYMBOL, amount);
    }).then(assertError).then(() => {
      return etoken2.balanceOf.call(owner, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), value);
      return etoken2.totalSupply.call(SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), value);
    });
  });
  it('should not be possible to revoke 2**255 with balance (2**255 - 1)', () => {
    var owner = accounts[0];
    var value = UINT_255_MINUS_1;
    var amount = UINT_255;
    var isReissuable = true;
    return etoken2.issueAsset(SYMBOL, value, NAME, DESCRIPTION, BASE_UNIT, isReissuable).then(() => {
      return etoken2.revokeAsset(SYMBOL, amount);
    }).then(assertError).then(() => {
      return etoken2.balanceOf.call(owner, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), value);
      return etoken2.totalSupply.call(SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), value);
    });
  });
  it('should be possible to revoke by non-owner', () => {
    var owner = accounts[0];
    var nonOwner = accounts[1];
    var balance = 100;
    var revokeAmount = 10;
    return etoken2.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(() => {
      return etoken2.transfer(nonOwner, balance, SYMBOL);
    }).then(() => {
      return etoken2.revokeAsset(SYMBOL, revokeAmount, {from: nonOwner});
    }).then(getEvents).then(events => {
      assert.equal(events.length, 1);
      return etoken2.balanceOf.call(owner, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), VALUE - balance);
      return etoken2.balanceOf.call(nonOwner, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), balance - revokeAmount);
      return etoken2.totalSupply.call(SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), VALUE - revokeAmount);
    });
  });
  it('should be possible to revoke 1 from fixed asset with 1 balance', () => {
    var owner = accounts[0];
    var value = 1;
    var amount = 1;
    var isReissuable = false;
    return etoken2.issueAsset(SYMBOL, value, NAME, DESCRIPTION, BASE_UNIT, isReissuable).then(() => {
      return etoken2.revokeAsset(SYMBOL, amount);
    }).then(getEvents).then(events => {
      assert.equal(events.length, 1);
      assert.equal(events[0].args.symbol.valueOf(), SYMBOL);
      assert.equal(events[0].args.value.valueOf(), amount);
      return etoken2.balanceOf.call(owner, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), 0);
      return etoken2.totalSupply.call(SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), 0);
    });
  });
  it('should be possible to revoke 1 from reissuable asset with 1 balance', () => {
    var owner = accounts[0];
    var value = 1;
    var amount = 1;
    var isReissuable = true;
    return etoken2.issueAsset(SYMBOL, value, NAME, DESCRIPTION, BASE_UNIT, isReissuable).then(() => {
      return etoken2.revokeAsset(SYMBOL, amount);
    }).then(() => {
      return etoken2.balanceOf.call(owner, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), 0);
      return etoken2.totalSupply.call(SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), 0);
    });
  });
  it('should be possible to revoke 2**255 with 2**255 balance', () => {
    var owner = accounts[0];
    var value = UINT_255;
    return etoken2.issueAsset(SYMBOL, value, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(() => {
      return etoken2.revokeAsset(SYMBOL, value);
    }).then(() => {
      return etoken2.balanceOf.call(owner, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), 0);
      return etoken2.totalSupply.call(SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), 0);
    });
  });
  it('should be possible to revoke (2**256 - 1) with (2**256 - 1) balance', () => {
    var owner = accounts[0];
    var value = UINT_256_MINUS_1;
    return etoken2.issueAsset(SYMBOL, value, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(() => {
      return etoken2.revokeAsset(SYMBOL, value);
    }).then(() => {
      return etoken2.balanceOf.call(owner, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), 0);
      return etoken2.totalSupply.call(SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), 0);
    });
  });
  it('should be possible to revoke 1 with 2 balance', () => {
    var owner = accounts[0];
    var value = 2;
    var amount = 1;
    return etoken2.issueAsset(SYMBOL, value, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(() => {
      return etoken2.revokeAsset(SYMBOL, amount);
    }).then(() => {
      return etoken2.balanceOf.call(owner, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), value - amount);
      return etoken2.totalSupply.call(SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), value - amount);
    });
  });
  it('should be possible to revoke 2 with (2**256 - 1) balance', () => {
    var owner = accounts[0];
    var value = UINT_256_MINUS_1;
    var amount = 2;
    var resultValue = UINT_256_MINUS_3;
    return etoken2.issueAsset(SYMBOL, value, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(() => {
      return etoken2.revokeAsset(SYMBOL, amount);
    }).then(() => {
      return etoken2.balanceOf.call(owner, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), resultValue);
      return etoken2.totalSupply.call(SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), resultValue);
    });
  });
  it('should keep revokes separated between assets', () => {
    var symbol = SYMBOL;
    var symbol2 = bytes32(200);
    var value = 500;
    var value2 = 1000;
    var holder = accounts[0];
    var amount = 100;
    var amount2 = 33;
    return etoken2.issueAsset(symbol, value, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(() => {
      return etoken2.issueAsset(symbol2, value2, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE);
    }).then(() => {
      return etoken2.revokeAsset(symbol, amount);
    }).then(() => {
      return etoken2.revokeAsset(symbol2, amount2);
    }).then(() => {
      return etoken2.balanceOf.call(holder, symbol);
    }).then(result => {
      assert.equal(result.valueOf(), value - amount);
      return etoken2.totalSupply.call(symbol);
    }).then(result => {
      assert.equal(result.valueOf(), value - amount);
      return etoken2.balanceOf.call(holder, symbol2);
    }).then(result => {
      assert.equal(result.valueOf(), value2 - amount2);
      return etoken2.totalSupply.call(symbol2);
    }).then(result => {
      assert.equal(result.valueOf(), value2 - amount2);
    });
  });
  it('should be possible to reissue 1 after revoke 1 with total supply (2**256 - 1)', () => {
    var owner = accounts[0];
    var value = UINT_256_MINUS_1;
    var amount = 1;
    var isReissuable = true;
    return etoken2.issueAsset(SYMBOL, value, NAME, DESCRIPTION, BASE_UNIT, isReissuable).then(() => {
      return etoken2.revokeAsset(SYMBOL, amount);
    }).then(() => {
      return etoken2.reissueAsset(SYMBOL, amount);
    }).then(() => {
      return etoken2.balanceOf.call(owner, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), value);
      return etoken2.totalSupply.call(SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), value);
    });
  });

  it('should not be possible to trust to already trusted address', () => {
    var holder = accounts[0];
    var trustee = accounts[1];
    return etoken2.trust(trustee).then(() => {
      return etoken2.trust.call(trustee);
    }).then(result => {
      assert.isFalse(result);
    });
  });
  it('should not be possible to trust to oneself', () => {
    var holder = accounts[0];
    return etoken2.trust.call(holder).then(result => {
      assert.isFalse(result);
    });
  });
  it('should be possible to trust by existing holder', () => {
    var holder = accounts[0];
    var trustee = accounts[1];
    return etoken2.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(() => {
      return etoken2.trust.call(trustee);
    }).then(result => {
      assert.isTrue(result);
    });
  });
  it('should be possible to trust by missing holder', () => {
    var holder = accounts[0];
    var trustee = accounts[1];
    return etoken2.trust.call(trustee).then(result => {
      assert.isTrue(result);
    });
  });
  it('should be possible to trust to multiple addresses', () => {
    var holder = accounts[0];
    var trustee1 = accounts[1];
    var trustee2 = accounts[2];
    return etoken2.trust(trustee1).then(result => {
      return etoken2.trust(trustee2);
    }).then(() => {
      return etoken2.isTrusted.call(holder, trustee1);
    }).then(result => {
      assert.isTrue(result);
      return etoken2.isTrusted.call(holder, trustee2);
    }).then(result => {
      assert.isTrue(result);
    });
  });

  it('should not be possible to distrust an untrusted address', () => {
    var holder = accounts[0];
    var trustee = accounts[1];
    var untrustee = accounts[2];
    return etoken2.trust(trustee).then(() => {
      return etoken2.distrust.call(untrustee);
    }).then(result => {
      assert.isFalse(result);
    });
  });
  it('should not be possible to distrust by missing holder', () => {
    var holder = accounts[0];
    var untrustee = accounts[1];
    return etoken2.distrust.call(untrustee).then(result => {
      assert.isFalse(result);
    });
  });
  it('should not be possible to distrust oneself', () => {
    var holder = accounts[0];
    return etoken2.distrust.call(holder).then(result => {
      assert.isFalse(result);
    });
  });
  it('should be possible to distrust a trusted address', () => {
    var holder = accounts[0];
    var trustee = accounts[1];
    return etoken2.trust(trustee).then(() => {
      return etoken2.distrust(trustee);
    }).then(() => {
      return etoken2.isTrusted.call(holder, trustee);
    }).then(result => {
      assert.isFalse(result);
    });
  });
  it('should be possible to distrust a last trusted address', () => {
    var holder = accounts[0];
    var trustee1 = accounts[1];
    var trustee2 = accounts[2];
    return etoken2.trust(trustee1).then(() => {
      return etoken2.trust(trustee2);
    }).then(() => {
      return etoken2.distrust(trustee2);
    }).then(() => {
      return etoken2.isTrusted.call(holder, trustee2);
    }).then(result => {
      assert.isFalse(result);
      return etoken2.isTrusted.call(holder, trustee1);
    }).then(result => {
      assert.isTrue(result);
    });
  });
  it('should be possible to distrust a not last trusted address', () => {
    var holder = accounts[0];
    var trustee1 = accounts[1];
    var trustee2 = accounts[2];
    return etoken2.trust(trustee1).then(() => {
      return etoken2.trust(trustee2);
    }).then(() => {
      return etoken2.distrust(trustee1);
    }).then(() => {
      return etoken2.isTrusted.call(holder, trustee1);
    }).then(result => {
      assert.isFalse(result);
      return etoken2.isTrusted.call(holder, trustee2);
    }).then(result => {
      assert.isTrue(result);
    });
  });

  it('should not be possible to recover to existing holder', () => {
    var holder = accounts[0];
    var trustee = accounts[1];
    var recoverTo = accounts[2];
    return etoken2.trust(trustee).then(() => {
      return etoken2.trust(accounts[3], {from: recoverTo});
    }).then(() => {
      return etoken2.recover.call(holder, recoverTo, {from: trustee});
    }).then(result => {
      assert.isFalse(result);
    });
  });
  it('should not be possible to recover by untrusted', () => {
    var holder = accounts[0];
    var trustee = accounts[1];
    var untrustee = accounts[2];
    var recoverTo = accounts[3];
    return etoken2.trust(trustee).then(() => {
      return etoken2.recover.call(holder, recoverTo, {from: untrustee});
    }).then(result => {
      assert.isFalse(result);
    });
  });
  it('should not be possible to recover from missing holder', () => {
    var holder = accounts[0];
    var untrustee = accounts[2];
    var recoverTo = accounts[3];
    return etoken2.recover.call(holder, recoverTo, {from: untrustee}).then(result => {
      assert.isFalse(result);
    });
  });
  it('should not be possible to recover by oneself', () => {
    var holder = accounts[0];
    var trustee = accounts[1];
    var recoverTo = accounts[3];
    return etoken2.trust(trustee).then(() => {
      return etoken2.recover.call(holder, recoverTo, {from: holder});
    }).then(result => {
      assert.isFalse(result);
    });
  });
  it('should not be possible to recover to oneself', () => {
    var holder = accounts[0];
    var trustee = accounts[1];
    return etoken2.trust(trustee).then(() => {
      return etoken2.recover.call(holder, holder, {from: trustee});
    }).then(result => {
      assert.isFalse(result);
    });
  });
  it('should not be possible to recover to the same address', () => {
    // Covered by 'should not be possible to recover to oneself'.
  });
  it('should not be possible to do transfer by target after failed recovery', () => {
    var holder = accounts[0];
    var untrustee = accounts[2];
    var recoverTo = accounts[3];
    return etoken2.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(() => {
      return etoken2.recover(holder, recoverTo, {from: untrustee});
    }).then(() => {
      return etoken2.transfer(untrustee, 100, SYMBOL, {from: recoverTo});
    }).then(() => {
      return etoken2.balanceOf.call(untrustee, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), 0);
      return etoken2.balanceOf.call(holder, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), VALUE);
    });
  });
  it('should be possible to do transfer by holder after failed recovery', () => {
    var holder = accounts[0];
    var trustee = accounts[1];
    var untrustee = accounts[2];
    var recoverTo = accounts[3];
    var amount = 100;
    return etoken2.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(() => {
      return etoken2.recover(holder, recoverTo, {from: untrustee});
    }).then(() => {
      return etoken2.transfer(untrustee, amount, SYMBOL, {from: holder});
    }).then(() => {
      return etoken2.balanceOf.call(untrustee, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), amount);
      return etoken2.balanceOf.call(holder, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), VALUE - amount);
    });
  });
  it('should be possible to recover', () => {
    var holder = accounts[0];
    var trustee = accounts[1];
    var recoverTo = accounts[2];
    return etoken2.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(() => {
      return etoken2.trust(trustee);
    }).then(() => {
      return etoken2.recover(holder, recoverTo, {from: trustee});
    }).then(getEvents).then(events => {
      assert.equal(events.length, 1);
      assert.equal(events[0].args.from.valueOf(), holder);
      assert.equal(events[0].args.to.valueOf(), recoverTo);
      assert.equal(events[0].args.by.valueOf(), trustee);
      return etoken2.balanceOf.call(recoverTo, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), VALUE);
    });
  });
  it('should be possible to recover multiple times', () => {
    var holder = accounts[0];
    var trustee = accounts[1];
    var recoverTo = accounts[2];
    var recoverTo2 = accounts[3];
    return etoken2.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(() => {
      return etoken2.trust(trustee);
    }).then(() => {
      return etoken2.recover(holder, recoverTo, {from: trustee});
    }).then(() => {
      return etoken2.recover(recoverTo, recoverTo2, {from: trustee});
    }).then(() => {
      return etoken2.balanceOf.call(recoverTo2, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), VALUE);
    });
  });
  it('should be possible to recover recovered address', () => {
    var holder = accounts[0];
    var trustee = accounts[1];
    var recoverTo = accounts[2];
    var recoverTo2 = accounts[3];
    return etoken2.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(() => {
      return etoken2.trust(trustee);
    }).then(() => {
      return etoken2.recover(holder, recoverTo, {from: trustee});
    }).then(() => {
      return etoken2.recover(holder, recoverTo2, {from: trustee});
    }).then(getEvents).then(events => {
      assert.equal(events.length, 1);
      assert.equal(events[0].args.from.valueOf(), recoverTo);
      assert.equal(events[0].args.to.valueOf(), recoverTo2);
      assert.equal(events[0].args.by.valueOf(), trustee);
      return etoken2.balanceOf.call(recoverTo2, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), VALUE);
    });
  });
  it('should be possible to do transfers after recovery by holder', () => {
    var holder = accounts[0];
    var trustee = accounts[1];
    var untrustee = accounts[2];
    var recoverTo = accounts[3];
    var amount = 100;
    return etoken2.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(() => {
      return etoken2.trust(trustee);
    }).then(() => {
      return etoken2.recover(holder, recoverTo, {from: trustee});
    }).then(() => {
      return etoken2.transfer(untrustee, amount, SYMBOL, {from: holder});
    }).then(() => {
      return etoken2.balanceOf.call(untrustee, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), amount);
      return etoken2.balanceOf.call(recoverTo, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), VALUE - amount);
    });
  });
  it('should not be possible to check balance after recovery by holder', () => {
    var holder = accounts[0];
    var trustee = accounts[1];
    var untrustee = accounts[2];
    var recoverTo = accounts[3];
    return etoken2.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(() => {
      return etoken2.trust(trustee);
    }).then(() => {
      return etoken2.recover(holder, recoverTo, {from: trustee});
    }).then(() => {
      return etoken2.balanceOf.call(holder, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), 0);
    });
  });
  it('should be possible to reissue after recovery', () => {
    var holder = accounts[0];
    var trustee = accounts[1];
    var recoverTo = accounts[3];
    var amount = 100;
    var isReissuable = true;
    return etoken2.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, isReissuable).then(() => {
      return etoken2.trust(trustee);
    }).then(() => {
      return etoken2.recover(holder, recoverTo, {from: trustee});
    }).then(() => {
      return etoken2.reissueAsset(SYMBOL, amount, {from: recoverTo});
    }).then(() => {
      return etoken2.balanceOf.call(recoverTo, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), VALUE + amount);
    });
  });
  it('should be possible to revoke after recovery', () => {
    var holder = accounts[0];
    var trustee = accounts[1];
    var recoverTo = accounts[3];
    var amount = 100;
    return etoken2.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(() => {
      return etoken2.trust(trustee);
    }).then(() => {
      return etoken2.recover(holder, recoverTo, {from: trustee});
    }).then(() => {
      return etoken2.revokeAsset(SYMBOL, amount, {from: recoverTo});
    }).then(() => {
      return etoken2.balanceOf.call(recoverTo, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), VALUE - amount);
    });
  });
  it('should be possible to change ownership after recovery', () => {
    var holder = accounts[0];
    var trustee = accounts[1];
    var newOwner = accounts[2];
    var recoverTo = accounts[3];
    return etoken2.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(() => {
      return etoken2.trust(trustee);
    }).then(() => {
      return etoken2.recover(holder, recoverTo, {from: trustee});
    }).then(() => {
      return etoken2.changeOwnership(SYMBOL, newOwner, {from: recoverTo});
    }).then(() => {
      return etoken2.owner.call(SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), newOwner);
      return etoken2.isOwner.call(holder, SYMBOL);
    }).then(result => {
      assert.isFalse(result.valueOf());
      return etoken2.isOwner.call(recoverTo, SYMBOL);
    }).then(result => {
      assert.isFalse(result.valueOf());
    });
  });
  it('should be possible to reissue after recovery by holder', () => {
    var holder = accounts[0];
    var trustee = accounts[1];
    var recoverTo = accounts[3];
    var amount = 100;
    var isReissuable = true;
    return etoken2.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, isReissuable).then(() => {
      return etoken2.trust(trustee);
    }).then(() => {
      return etoken2.recover(holder, recoverTo, {from: trustee});
    }).then(() => {
      return etoken2.reissueAsset(SYMBOL, amount);
    }).then(() => {
      return etoken2.balanceOf.call(recoverTo, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), VALUE + amount);
    });
  });
  it('should be possible to revoke after recovery by holder', () => {
    var holder = accounts[0];
    var trustee = accounts[1];
    var recoverTo = accounts[3];
    var amount = 100;
    return etoken2.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(() => {
      return etoken2.trust(trustee);
    }).then(() => {
      return etoken2.recover(holder, recoverTo, {from: trustee});
    }).then(() => {
      return etoken2.revokeAsset(SYMBOL, amount);
    }).then(() => {
      return etoken2.balanceOf.call(recoverTo, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), VALUE - amount);
    });
  });
  it('should be possible to change ownership after recovery by holder', () => {
    var holder = accounts[0];
    var trustee = accounts[1];
    var newOwner = accounts[2];
    var recoverTo = accounts[3];
    return etoken2.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(() => {
      return etoken2.trust(trustee);
    }).then(() => {
      return etoken2.recover(holder, recoverTo, {from: trustee});
    }).then(() => {
      return etoken2.changeOwnership(SYMBOL, newOwner, {from: holder});
    }).then(getEvents).then(events => {
      assert.equal(events.length, 1);
      assert.equal(events[0].args.from.valueOf(), recoverTo);
      assert.equal(events[0].args.to.valueOf(), newOwner);
      assert.equal(events[0].args.symbol.valueOf(), SYMBOL);
      return etoken2.owner.call(SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), newOwner);
      return etoken2.isOwner.call(holder, SYMBOL);
    }).then(result => {
      assert.isFalse(result.valueOf());
      return etoken2.isOwner.call(recoverTo, SYMBOL);
    }).then(result => {
      assert.isFalse(result.valueOf());
    });
  });
  it('should be possible to do transfers after recovery by recovered address', () => {
    var holder = accounts[0];
    var trustee = accounts[1];
    var untrustee = accounts[2];
    var recoverTo = accounts[3];
    var amount = 100;
    return etoken2.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(() => {
      return etoken2.trust(trustee);
    }).then(() => {
      return etoken2.recover(holder, recoverTo, {from: trustee});
    }).then(() => {
      return etoken2.transfer(untrustee, amount, SYMBOL, {from: recoverTo});
    }).then(() => {
      return etoken2.balanceOf.call(untrustee, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), amount);
      return etoken2.balanceOf.call(recoverTo, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), VALUE - amount);
    });
  });
  it('should recover asset ownership', () => {
    var holder = accounts[0];
    var trustee = accounts[1];
    var recoverTo = accounts[2];
    return etoken2.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(() => {
      return etoken2.trust(trustee);
    }).then(() => {
      return etoken2.recover(holder, recoverTo, {from: trustee});
    }).then(() => {
      return etoken2.owner.call(SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), recoverTo);
    });
  });
  it('should recover balances', () => {
    var holder = accounts[0];
    var trustee = accounts[1];
    var recoverTo = accounts[2];
    var symbol1 = bytes32(31);
    var symbol2 = bytes32(32);
    var value1 = 100;
    var value2 = 200;
    return etoken2.issueAsset(symbol1, value1, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(() => {
      return etoken2.issueAsset(symbol2, value2, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE);
    }).then(() => {
      return etoken2.trust(trustee);
    }).then(() => {
      return etoken2.recover(holder, recoverTo, {from: trustee});
    }).then(() => {
      return etoken2.balanceOf.call(recoverTo, symbol1);
    }).then(result => {
      assert.equal(result.valueOf(), value1);
      return etoken2.balanceOf.call(recoverTo, symbol2);
    }).then(result => {
      assert.equal(result.valueOf(), value2);
    });
  });
  it('should recover allowances', () => {
    var holder = accounts[0];
    var trustee = accounts[1];
    var recoverTo = accounts[2];
    var symbol1 = bytes32(31);
    var symbol2 = bytes32(32);
    var spender1 = accounts[3];
    var spender2 = accounts[4];
    var value1 = 100;
    var value2 = 200;
    return etoken2.issueAsset(symbol1, value1, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(() => {
      return etoken2.issueAsset(symbol2, value2, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE);
    }).then(() => {
      return etoken2.approve(spender1, value1, symbol1);
    }).then(() => {
      return etoken2.approve(spender2, value2, symbol2);
    }).then(() => {
      return etoken2.trust(trustee);
    }).then(() => {
      return etoken2.recover(holder, recoverTo, {from: trustee});
    }).then(() => {
      return etoken2.allowance.call(recoverTo, spender1, symbol1);
    }).then(result => {
      assert.equal(result.valueOf(), value1);
      return etoken2.allowance.call(recoverTo, spender2, symbol2);
    }).then(result => {
      assert.equal(result.valueOf(), value2);
    });
  });
  it('should recover trusts', () => {
    var holder = accounts[0];
    var trustee1 = accounts[1];
    var trustee2 = accounts[2];
    var recoverTo = accounts[3];
    var untrustee = accounts[5];
    return etoken2.trust(trustee1).then(() => {
      return etoken2.trust(trustee2);
    }).then(() => {
      return etoken2.recover(holder, recoverTo, {from: trustee1});
    }).then(() => {
      return etoken2.isTrusted.call(recoverTo, trustee1);
    }).then(result => {
      assert.isTrue(result);
      return etoken2.isTrusted.call(recoverTo, trustee2);
    }).then(result => {
      assert.isTrue(result);
      return etoken2.isTrusted.call(recoverTo, untrustee);
    }).then(result => {
      assert.isFalse(result);
    });
  });

  it('should not be possible to set allowance for missing symbol', () => {
    var owner = accounts[0];
    var spender = accounts[1];
    var missingSymbol = bytes32(33);
    return etoken2.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(() => {
      return etoken2.approve(spender, 100, missingSymbol);
    }).then(assertError).then(() => {
      return etoken2.allowance.call(owner, spender, missingSymbol);
    }).then(result => {
      assert.equal(result.valueOf(), 0);
    });
  });
  it('should not be possible to set allowance for missing symbol for oneself', () => {
    var owner = accounts[0];
    var missingSymbol = bytes32(33);
    return etoken2.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(() => {
      return etoken2.approve(owner, 100, missingSymbol);
    }).then(assertError).then(() => {
      return etoken2.allowance.call(owner, owner, missingSymbol);
    }).then(result => {
      assert.equal(result.valueOf(), 0);
    });
  });
  it('should not be possible to set allowance for oneself', () => {
    var owner = accounts[0];
    return etoken2.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(() => {
      return etoken2.approve(owner, 100, SYMBOL);
    }).then(assertError).then(() => {
      return etoken2.allowance.call(owner, owner, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), 0);
    });
  });
  it('should be possible to set allowance from missing holder to missing holder', () => {
    var holder = accounts[1];
    var spender = accounts[2];
    var value = 100;
    return etoken2.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(() => {
      return etoken2.approve(spender, value, SYMBOL, {from: holder});
    }).then(getEvents).then(events => {
      assert.equal(events.length, 1);
      assert.equal(events[0].args.from.valueOf(), holder);
      assert.equal(events[0].args.spender.valueOf(), spender);
      assert.equal(events[0].args.symbol.valueOf(), SYMBOL);
      assert.equal(events[0].args.value.valueOf(), value);
      return etoken2.allowance.call(holder, spender, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), value);
    });
  });
  it('should be possible to set allowance from missing holder to existing holder', () => {
    var holder = accounts[1];
    var spender = accounts[0];
    var value = 100;
    return etoken2.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(() => {
      return etoken2.approve(spender, value, SYMBOL, {from: holder});
    }).then(() => {
      return etoken2.allowance.call(holder, spender, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), value);
    });
  });
  it('should be possible to set allowance from existing holder to missing holder', () => {
    var holder = accounts[0];
    var spender = accounts[2];
    var value = 100;
    return etoken2.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(() => {
      return etoken2.approve(spender, value, SYMBOL, {from: holder});
    }).then(() => {
      return etoken2.allowance.call(holder, spender, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), value);
    });
  });
  it('should be possible to set allowance from existing holder to existing holder', () => {
    var holder = accounts[0];
    var spender = accounts[2];
    var value = 100;
    return etoken2.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(() => {
      return etoken2.transfer(spender, 1, SYMBOL, {from: holder});
    }).then(() => {
      return etoken2.approve(spender, value, SYMBOL, {from: holder});
    }).then(() => {
      return etoken2.allowance.call(holder, spender, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), value);
    });
  });
  it('should be possible to set allowance value 0', () => {
    // Covered by 'should be possible to override allowance value with 0 value'.
  });
  it('should be possible to set allowance with (2**256 - 1) value', () => {
    var holder = accounts[0];
    var spender = accounts[1];
    var value = UINT_256_MINUS_1;
    return etoken2.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(() => {
      return etoken2.approve(spender, value, SYMBOL);
    }).then(() => {
      return etoken2.allowance.call(holder, spender, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), value);
    });
  });
  it('should be possible to set allowance value less then balance', () => {
    var holder = accounts[0];
    var spender = accounts[1];
    var value = 1;
    return etoken2.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(() => {
      return etoken2.approve(spender, value, SYMBOL);
    }).then(() => {
      return etoken2.allowance.call(holder, spender, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), value);
    });
  });
  it('should be possible to set allowance value equal to balance', () => {
    var holder = accounts[0];
    var spender = accounts[1];
    var value = VALUE;
    return etoken2.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(() => {
      return etoken2.approve(spender, value, SYMBOL);
    }).then(() => {
      return etoken2.allowance.call(holder, spender, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), value);
    });
  });
  it('should be possible to set allowance value more then balance', () => {
    // Covered by 'should be possible to set allowance with (2**256 - 1) value'.
  });
  it('should be possible to override allowance value with 0 value', () => {
    var holder = accounts[0];
    var spender = accounts[1];
    var value = 0;
    return etoken2.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(() => {
      return etoken2.approve(spender, 100, SYMBOL);
    }).then(() => {
      return etoken2.approve(spender, value, SYMBOL);
    }).then(() => {
      return etoken2.allowance.call(holder, spender, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), value);
    });
  });
  it('should be possible to override allowance value with non 0 value', () => {
    var holder = accounts[0];
    var spender = accounts[1];
    var value = 1000;
    return etoken2.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(() => {
      return etoken2.approve(spender, 100, SYMBOL);
    }).then(() => {
      return etoken2.approve(spender, value, SYMBOL);
    }).then(() => {
      return etoken2.allowance.call(holder, spender, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), value);
    });
  });
  it('should not affect balance when setting allowance', () => {
    var holder = accounts[0];
    return etoken2.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(() => {
      return etoken2.approve(accounts[1], 100, SYMBOL);
    }).then(() => {
      return etoken2.balanceOf.call(holder, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), VALUE);
    });
  });
  it('should be possible to set allowance', () => {
    // Covered by other tests above.
  });

  it('should not be possible to do allowance transfer by not allowed existing spender, from existing holder', () => {
    var holder = accounts[0];
    var spender = accounts[1];
    var value = 100;
    var expectedSpenderBalance = 100;
    var expectedHolderBalance = VALUE - value;
    return etoken2.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(() => {
      return etoken2.transfer(spender, value, SYMBOL);
    }).then(() => {
      return etoken2.transferFrom(holder, spender, 50, SYMBOL, {from: spender});
    }).then(() => {
      return etoken2.balanceOf.call(spender, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), expectedSpenderBalance);
      return etoken2.balanceOf.call(holder, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), expectedHolderBalance);
    });
  });
  it('should not be possible to do allowance transfer by not allowed existing spender, from missing holder', () => {
    var holder = accounts[2];
    var spender = accounts[1];
    var value = 100;
    var expectedSpenderBalance = 100;
    var expectedHolderBalance = 0;
    return etoken2.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(() => {
      return etoken2.transfer(spender, value, SYMBOL);
    }).then(() => {
      return etoken2.transferFrom(holder, spender, 50, SYMBOL, {from: spender});
    }).then(() => {
      return etoken2.balanceOf.call(spender, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), expectedSpenderBalance);
      return etoken2.balanceOf.call(holder, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), expectedHolderBalance);
    });
  });
  it('should not be possible to do allowance transfer by not allowed missing spender, from existing holder', () => {
    var holder = accounts[0];
    var spender = accounts[1];
    var expectedSpenderBalance = 0;
    var expectedHolderBalance = VALUE;
    return etoken2.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(() => {
      return etoken2.transferFrom(holder, spender, 50, SYMBOL, {from: spender});
    }).then(() => {
      return etoken2.balanceOf.call(spender, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), expectedSpenderBalance);
      return etoken2.balanceOf.call(holder, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), expectedHolderBalance);
    });
  });
  it('should not be possible to do allowance transfer by not allowed missing spender, from missing holder', () => {
    var holder = accounts[2];
    var spender = accounts[1];
    var expectedSpenderBalance = 0;
    var expectedHolderBalance = 0;
    return etoken2.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(() => {
      return etoken2.transferFrom(holder, spender, 50, SYMBOL, {from: spender});
    }).then(() => {
      return etoken2.balanceOf.call(spender, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), expectedSpenderBalance);
      return etoken2.balanceOf.call(holder, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), expectedHolderBalance);
    });
  });
  it('should not be possible to do allowance transfer from and to the same holder', () => {
    var holder = accounts[0];
    var spender = accounts[1];
    return etoken2.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(() => {
      return etoken2.approve(spender, 50, SYMBOL);
    }).then(() => {
      return etoken2.transferFrom(holder, holder, 50, SYMBOL, {from: spender});
    }).then(assertError).then(() => {
      return etoken2.balanceOf.call(holder, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), VALUE);
    });
  });
  it('should be possible to do allowance transfer from oneself', () => {
    var holder = accounts[0];
    var receiver = accounts[1];
    var amount = 50;
    return etoken2.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(() => {
      return etoken2.transferFrom(holder, receiver, amount, SYMBOL);
    }).then(() => {
      return etoken2.balanceOf.call(holder, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), VALUE - amount);
      return etoken2.balanceOf.call(receiver, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), amount);
    });
  });
  it('should not be possible to do allowance transfer with 0 value', () => {
    var holder = accounts[0];
    var spender = accounts[1];
    var value = 0;
    var resultValue = 0;
    return etoken2.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(() => {
      return etoken2.approve(spender, 100, SYMBOL);
    }).then(() => {
      return etoken2.transferFrom(holder, spender, value, SYMBOL, {from: spender});
    }).then(assertError).then(() => {
      return etoken2.balanceOf.call(holder, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), VALUE);
      return etoken2.balanceOf.call(spender, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), resultValue);
    });
  });
  it('should not be possible to do allowance transfer with value less than balance, more than allowed', () => {
    var holder = accounts[0];
    var spender = accounts[1];
    var balance = 1000;
    var value = 999;
    var allowed = 998;
    var resultValue = 0;
    return etoken2.issueAsset(SYMBOL, balance, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(() => {
      return etoken2.approve(spender, allowed, SYMBOL);
    }).then(() => {
      return etoken2.transferFrom(holder, spender, value, SYMBOL, {from: spender});
    }).then(() => {
      return etoken2.balanceOf.call(holder, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), balance);
      return etoken2.balanceOf.call(spender, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), resultValue);
    });
  });
  it('should not be possible to do allowance transfer with value equal to balance, more than allowed', () => {
    var holder = accounts[0];
    var spender = accounts[1];
    var balance = 1000;
    var value = 1000;
    var allowed = 999;
    var resultValue = 0;
    return etoken2.issueAsset(SYMBOL, balance, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(() => {
      return etoken2.approve(spender, allowed, SYMBOL);
    }).then(() => {
      return etoken2.transferFrom(holder, spender, value, SYMBOL, {from: spender});
    }).then(() => {
      return etoken2.balanceOf.call(holder, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), balance);
      return etoken2.balanceOf.call(spender, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), resultValue);
    });
  });
  it('should not be possible to do allowance transfer with value more than balance, less than allowed', () => {
    var holder = accounts[0];
    var spender = accounts[1];
    var balance = 199;
    var value = 200;
    var allowed = 201;
    var resultValue = 0;
    return etoken2.issueAsset(SYMBOL, balance, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(() => {
      return etoken2.approve(spender, allowed, SYMBOL);
    }).then(() => {
      return etoken2.transferFrom(holder, spender, value, SYMBOL, {from: spender});
    }).then(() => {
      return etoken2.balanceOf.call(holder, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), balance);
      return etoken2.balanceOf.call(spender, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), resultValue);
    });
  });
  it('should not be possible to do allowance transfer with value less than balance, more than allowed after another tranfer', () => {
    var holder = accounts[0];
    var spender = accounts[1];
    var balance = 102;
    var anotherValue = 10;
    var value = 91;
    var allowed = 100;
    var expectedHolderBalance = balance - anotherValue;
    var resultValue = anotherValue;
    return etoken2.issueAsset(SYMBOL, balance, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(() => {
      return etoken2.approve(spender, allowed, SYMBOL);
    }).then(() => {
      return etoken2.transferFrom(holder, spender, anotherValue, SYMBOL, {from: spender});
    }).then(() => {
      return etoken2.transferFrom(holder, spender, value, SYMBOL, {from: spender});
    }).then(() => {
      return etoken2.balanceOf.call(holder, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), expectedHolderBalance);
      return etoken2.balanceOf.call(spender, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), resultValue);
    });
  });
  it('should not be possible to do allowance transfer with missing symbol when allowed for another symbol', () => {
    var holder = accounts[0];
    var spender = accounts[1];
    var balance = 1000;
    var value = 200;
    var allowed = 1000;
    var missingSymbol = bytes32(33);
    var resultValue = 0;
    return etoken2.issueAsset(SYMBOL, balance, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(() => {
      return etoken2.approve(spender, allowed, SYMBOL);
    }).then(() => {
      return etoken2.transferFrom(holder, spender, value, missingSymbol, {from: spender});
    }).then(() => {
      return etoken2.balanceOf.call(holder, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), balance);
      return etoken2.balanceOf.call(spender, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), resultValue);
      return etoken2.balanceOf.call(holder, missingSymbol);
    }).then(result => {
      assert.equal(result.valueOf(), 0);
      return etoken2.balanceOf.call(spender, missingSymbol);
    }).then(result => {
      assert.equal(result.valueOf(), 0);
    });
  });
  it('should not be possible to do allowance transfer when allowed for another symbol', () => {
    var holder = accounts[0];
    var spender = accounts[1];
    var balance = 1000;
    var value = 200;
    var allowed = 1000;
    var symbol2 = bytes32(2);
    var resultValue = 0;
    return etoken2.issueAsset(SYMBOL, balance, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(() => {
      return etoken2.issueAsset(symbol2, balance, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE);
    }).then(() => {
      return etoken2.approve(spender, allowed, SYMBOL);
    }).then(() => {
      return etoken2.transferFrom(holder, spender, value, symbol2, {from: spender});
    }).then(() => {
      return etoken2.balanceOf.call(holder, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), balance);
      return etoken2.balanceOf.call(spender, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), resultValue);
      return etoken2.balanceOf.call(holder, symbol2);
    }).then(result => {
      assert.equal(result.valueOf(), balance);
      return etoken2.balanceOf.call(spender, symbol2);
    }).then(result => {
      assert.equal(result.valueOf(), 0);
    });
  });
  it('should not be possible to do allowance transfer with missing symbol when not allowed', () => {
    var holder = accounts[0];
    var spender = accounts[1];
    var balance = 1000;
    var value = 200;
    var missingSymbol = bytes32(33);
    var resultValue = 0;
    return etoken2.issueAsset(SYMBOL, balance, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(() => {
      return etoken2.transferFrom(holder, spender, value, missingSymbol, {from: spender});
    }).then(() => {
      return etoken2.balanceOf.call(holder, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), balance);
      return etoken2.balanceOf.call(spender, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), resultValue);
      return etoken2.balanceOf.call(holder, missingSymbol);
    }).then(result => {
      assert.equal(result.valueOf(), 0);
      return etoken2.balanceOf.call(spender, missingSymbol);
    }).then(result => {
      assert.equal(result.valueOf(), 0);
    });
  });
  it('should be possible to do allowance transfer by allowed existing spender', () => {
    var holder = accounts[0];
    var spender = accounts[1];
    var existValue = 100;
    var value = 300;
    var expectedHolderBalance = VALUE - existValue - value;
    var expectedSpenderBalance = existValue + value;
    return etoken2.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(() => {
      return etoken2.transfer(spender, existValue, SYMBOL);
    }).then(() => {
      return etoken2.approve(spender, value, SYMBOL);
    }).then(() => {
      return etoken2.transferFrom(holder, spender, value, SYMBOL, {from: spender});
    }).then(() => {
      return etoken2.balanceOf.call(holder, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), expectedHolderBalance);
      return etoken2.balanceOf.call(spender, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), expectedSpenderBalance);
    });
  });
  it('should be possible to do allowance transfer by allowed missing spender', () => {
    var holder = accounts[0];
    var spender = accounts[1];
    var value = 300;
    var expectedHolderBalance = VALUE - value;
    var expectedSpenderBalance = value;
    return etoken2.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(() => {
      return etoken2.approve(spender, value, SYMBOL);
    }).then(() => {
      return etoken2.transferFrom(holder, spender, value, SYMBOL, {from: spender});
    }).then(() => {
      return etoken2.balanceOf.call(holder, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), expectedHolderBalance);
      return etoken2.balanceOf.call(spender, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), expectedSpenderBalance);
    });
  });
  it('should be possible to do allowance transfer to oneself', () => {
    // Covered by 'should be possible to do allowance transfer by allowed existing spender'.
  });
  it('should be possible to do allowance transfer to existing holder', () => {
    var holder = accounts[0];
    var spender = accounts[1];
    var receiver = accounts[2];
    var existValue = 100;
    var value = 300;
    var expectedHolderBalance = VALUE - existValue - value;
    var expectedReceiverBalance = existValue + value;
    return etoken2.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(() => {
      return etoken2.transfer(receiver, existValue, SYMBOL);
    }).then(() => {
      return etoken2.approve(spender, value, SYMBOL);
    }).then(() => {
      return etoken2.transferFrom(holder, receiver, value, SYMBOL, {from: spender});
    }).then(getEvents).then(events => {
      assert.equal(events.length, 1);
      assert.equal(events[0].args.from.valueOf(), holder);
      assert.equal(events[0].args.to.valueOf(), receiver);
      assert.equal(events[0].args.symbol.valueOf(), SYMBOL);
      assert.equal(events[0].args.value.valueOf(), value);
      assert.equal(events[0].args.reference.valueOf(), '');
      return etoken2.balanceOf.call(holder, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), expectedHolderBalance);
      return etoken2.balanceOf.call(receiver, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), expectedReceiverBalance);
    });
  });
  it('should be possible to do allowance transfer to missing holder', () => {
    var holder = accounts[0];
    var spender = accounts[1];
    var receiver = accounts[2];
    var value = 300;
    var expectedHolderBalance = VALUE - value;
    var expectedReceiverBalance = value;
    return etoken2.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(() => {
      return etoken2.approve(spender, value, SYMBOL);
    }).then(() => {
      return etoken2.transferFrom(holder, receiver, value, SYMBOL, {from: spender});
    }).then(() => {
      return etoken2.balanceOf.call(holder, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), expectedHolderBalance);
      return etoken2.balanceOf.call(receiver, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), expectedReceiverBalance);
    });
  });
  it('should be possible to do allowance transfer with value less than balance and less than allowed', () => {
    var holder = accounts[0];
    var spender = accounts[1];
    var balance = 201;
    var value = 200;
    var allowed = 201;
    var expectedHolderBalance = balance - value;
    return etoken2.issueAsset(SYMBOL, balance, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(() => {
      return etoken2.approve(spender, allowed, SYMBOL);
    }).then(() => {
      return etoken2.transferFrom(holder, spender, value, SYMBOL, {from: spender});
    }).then(() => {
      return etoken2.balanceOf.call(holder, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), expectedHolderBalance);
      return etoken2.balanceOf.call(spender, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), value);
    });
  });
  it('should be possible to do allowance transfer with value less than balance and equal to allowed', () => {
    var holder = accounts[0];
    var spender = accounts[1];
    var balance = 201;
    var value = 200;
    var allowed = 200;
    var expectedHolderBalance = balance - value;
    return etoken2.issueAsset(SYMBOL, balance, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(() => {
      return etoken2.approve(spender, allowed, SYMBOL);
    }).then(() => {
      return etoken2.transferFrom(holder, spender, value, SYMBOL, {from: spender});
    }).then(() => {
      return etoken2.balanceOf.call(holder, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), expectedHolderBalance);
      return etoken2.balanceOf.call(spender, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), value);
    });
  });
  it('should be possible to do allowance transfer with value equal to balance and less than allowed', () => {
    var holder = accounts[0];
    var spender = accounts[1];
    var balance = 200;
    var value = 200;
    var allowed = 201;
    var expectedHolderBalance = balance - value;
    return etoken2.issueAsset(SYMBOL, balance, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(() => {
      return etoken2.approve(spender, allowed, SYMBOL);
    }).then(() => {
      return etoken2.transferFrom(holder, spender, value, SYMBOL, {from: spender});
    }).then(() => {
      return etoken2.balanceOf.call(holder, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), expectedHolderBalance);
      return etoken2.balanceOf.call(spender, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), value);
    });
  });
  it('should be possible to do allowance transfer with value equal to balance and equal to allowed', () => {
    var holder = accounts[0];
    var spender = accounts[1];
    var balance = 200;
    var value = 200;
    var allowed = 200;
    var expectedHolderBalance = balance - value;
    return etoken2.issueAsset(SYMBOL, balance, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(() => {
      return etoken2.approve(spender, allowed, SYMBOL);
    }).then(() => {
      return etoken2.transferFrom(holder, spender, value, SYMBOL, {from: spender});
    }).then(() => {
      return etoken2.balanceOf.call(holder, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), expectedHolderBalance);
      return etoken2.balanceOf.call(spender, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), value);
    });
  });
  it('should be possible to do allowance transfer with value less than balance and less than allowed after another transfer', () => {
    var holder = accounts[0];
    var spender = accounts[1];
    var balance = 201;
    var anotherValue = 1;
    var value = 199;
    var allowed = 201;
    var expectedSpenderBalance = anotherValue + value;
    var expectedHolderBalance = balance - anotherValue - value;
    return etoken2.issueAsset(SYMBOL, balance, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(() => {
      return etoken2.approve(spender, allowed, SYMBOL);
    }).then(() => {
      return etoken2.transferFrom(holder, spender, anotherValue, SYMBOL, {from: spender});
    }).then(() => {
      return etoken2.transferFrom(holder, spender, value, SYMBOL, {from: spender});
    }).then(() => {
      return etoken2.balanceOf.call(holder, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), expectedHolderBalance);
      return etoken2.balanceOf.call(spender, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), expectedSpenderBalance);
    });
  });
  it('should be possible to do allowance transfer with value less than balance and equal to allowed after another transfer', () => {
    var holder = accounts[0];
    var spender = accounts[1];
    var balance = 201;
    var anotherValue = 1;
    var value = 199;
    var allowed = 200;
    var expectedSpenderBalance = anotherValue + value;
    var expectedHolderBalance = balance - anotherValue - value;
    return etoken2.issueAsset(SYMBOL, balance, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(() => {
      return etoken2.approve(spender, allowed, SYMBOL);
    }).then(() => {
      return etoken2.transferFrom(holder, spender, anotherValue, SYMBOL, {from: spender});
    }).then(() => {
      return etoken2.transferFrom(holder, spender, value, SYMBOL, {from: spender});
    }).then(() => {
      return etoken2.balanceOf.call(holder, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), expectedHolderBalance);
      return etoken2.balanceOf.call(spender, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), expectedSpenderBalance);
    });
  });
  it('should be possible to do allowance transfer with value (2**256 - 1)', () => {
    var holder = accounts[0];
    var spender = accounts[1];
    var value = UINT_256_MINUS_1;
    return etoken2.issueAsset(SYMBOL, value, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(() => {
      return etoken2.approve(spender, value, SYMBOL);
    }).then(() => {
      return etoken2.transferFrom(holder, spender, value, SYMBOL, {from: spender});
    }).then(() => {
      return etoken2.balanceOf.call(holder, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), 0);
      return etoken2.balanceOf.call(spender, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), value);
    });
  });
  it('should be possible to do allowance transfer with reference', () => {
    var holder = accounts[0];
    var spender = accounts[1];
    var receiver = accounts[2];
    var value = 300;
    var expectedHolderBalance = VALUE - value;
    var expectedReceiverBalance = value;
    var reference = 'just some arbitrary string.';
    return etoken2.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(() => {
      return etoken2.approve(spender, value, SYMBOL);
    }).then(() => {
      return etoken2.transferFromWithReference(holder, receiver, value, SYMBOL, reference, {from: spender});
    }).then(getEvents).then(events => {
      assert.equal(events.length, 1);
      assert.equal(events[0].args.from.valueOf(), holder);
      assert.equal(events[0].args.to.valueOf(), receiver);
      assert.equal(events[0].args.symbol.valueOf(), SYMBOL);
      assert.equal(events[0].args.value.valueOf(), value);
      assert.equal(events[0].args.reference.valueOf(), reference);
      return etoken2.balanceOf.call(holder, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), expectedHolderBalance);
      return etoken2.balanceOf.call(receiver, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), expectedReceiverBalance);
    });
  });

  it('should return 0 allowance for existing owner and not allowed existing spender', () => {
    var holder = accounts[0];
    var spender = accounts[1];
    return etoken2.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(() => {
      return etoken2.transfer(spender, 100, SYMBOL);
    }).then(() => {
      return etoken2.allowance.call(holder, spender, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), 0);
    });
  });
  it('should return 0 allowance for existing owner and not allowed missing spender', () => {
    var holder = accounts[0];
    var spender = accounts[1];
    return etoken2.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(() => {
      return etoken2.allowance.call(holder, spender, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), 0);
    });
  });
  it('should return 0 allowance for missing owner and existing spender', () => {
    var holder = accounts[1];
    var spender = accounts[0];
    return etoken2.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(() => {
      return etoken2.allowance.call(holder, spender, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), 0);
    });
  });
  it('should return 0 allowance for missing owner and missing spender', () => {
    var holder = accounts[1];
    var spender = accounts[2];
    return etoken2.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(() => {
      return etoken2.allowance.call(holder, spender, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), 0);
    });
  });
  it('should return 0 allowance for existing oneself', () => {
    var holder = accounts[0];
    var spender = holder;
    return etoken2.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(() => {
      return etoken2.allowance.call(holder, spender, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), 0);
    });
  });
  it('should return 0 allowance for missing oneself', () => {
    var holder = accounts[1];
    var spender = holder;
    return etoken2.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(() => {
      return etoken2.allowance.call(holder, spender, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), 0);
    });
  });
  it('should return 0 allowance for missing symbol', () => {
    var holder = accounts[0];
    var spender = accounts[1];
    var missingSymbol = bytes32(33);
    return etoken2.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(() => {
      return etoken2.approve(spender, 100, SYMBOL);
    }).then(() => {
      return etoken2.allowance.call(holder, spender, missingSymbol);
    }).then(result => {
      assert.equal(result.valueOf(), 0);
    });
  });
  it('should respect symbol when telling allowance', () => {
    var holder = accounts[0];
    var spender = accounts[1];
    var symbol = SYMBOL;
    var symbol2 = bytes32(2);
    var value = 100;
    var value2 = 200;
    return etoken2.issueAsset(symbol, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(() => {
      return etoken2.issueAsset(symbol2, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE);
    }).then(() => {
      return etoken2.approve(spender, value, symbol);
    }).then(() => {
      return etoken2.approve(spender, value2, symbol2);
    }).then(() => {
      return etoken2.allowance.call(holder, spender, symbol);
    }).then(result => {
      assert.equal(result.valueOf(), value);
      return etoken2.allowance.call(holder, spender, symbol2);
    }).then(result => {
      assert.equal(result.valueOf(), value2);
    });
  });
  it('should respect holder when telling allowance', () => {
    var holder = accounts[0];
    var holder2 = accounts[1];
    var spender = accounts[2];
    var value = 100;
    var value2 = 200;
    return etoken2.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(() => {
      return etoken2.approve(spender, value, SYMBOL);
    }).then(() => {
      return etoken2.approve(spender, value2, SYMBOL, {from: holder2});
    }).then(() => {
      return etoken2.allowance.call(holder, spender, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), value);
      return etoken2.allowance.call(holder2, spender, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), value2);
    });
  });
  it('should respect spender when telling allowance', () => {
    var holder = accounts[0];
    var spender = accounts[1];
    var spender2 = accounts[2];
    var value = 100;
    var value2 = 200;
    return etoken2.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(() => {
      return etoken2.approve(spender, value, SYMBOL);
    }).then(() => {
      return etoken2.approve(spender2, value2, SYMBOL);
    }).then(() => {
      return etoken2.allowance.call(holder, spender, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), value);
      return etoken2.allowance.call(holder, spender2, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), value2);
    });
  });
  it('should be possible to check allowance of existing owner and allowed existing spender', () => {
    var holder = accounts[0];
    var spender = accounts[1];
    var value = 300;
    return etoken2.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(() => {
      return etoken2.transfer(spender, 100, SYMBOL);
    }).then(() => {
      return etoken2.approve(spender, value, SYMBOL);
    }).then(() => {
      return etoken2.allowance.call(holder, spender, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), value);
    });
  });
  it('should be possible to check allowance of existing owner and allowed missing spender', () => {
    var holder = accounts[0];
    var spender = accounts[1];
    var value = 300;
    return etoken2.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(() => {
      return etoken2.approve(spender, value, SYMBOL);
    }).then(() => {
      return etoken2.allowance.call(holder, spender, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), value);
    });
  });
  it('should return 0 allowance after another transfer', () => {
    var holder = accounts[0];
    var spender = accounts[1];
    var value = 300;
    var resultValue = 0;
    return etoken2.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(() => {
      return etoken2.approve(spender, value, SYMBOL);
    }).then(() => {
      return etoken2.transferFrom(holder, spender, value, SYMBOL, {from: spender});
    }).then(() => {
      return etoken2.allowance.call(holder, spender, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), resultValue);
    });
  });
  it('should return 1 allowance after another transfer', () => {
    var holder = accounts[0];
    var spender = accounts[1];
    var receiver = accounts[2];
    var value = 300;
    var transfer = 299;
    var resultValue = 1;
    return etoken2.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(() => {
      return etoken2.approve(spender, value, SYMBOL);
    }).then(() => {
      return etoken2.transferFrom(holder, receiver, transfer, SYMBOL, {from: spender});
    }).then(() => {
      return etoken2.allowance.call(holder, spender, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), resultValue);
    });
  });
  it('should return 2**255 allowance after another transfer', () => {
    var holder = accounts[0];
    var spender = accounts[1];
    var value = UINT_256_MINUS_1;
    var transfer = UINT_255_MINUS_1;
    var resultValue = UINT_255;
    return etoken2.issueAsset(SYMBOL, value, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(() => {
      return etoken2.approve(spender, value, SYMBOL);
    }).then(() => {
      return etoken2.transferFrom(holder, spender, transfer, SYMBOL, {from: spender});
    }).then(() => {
      return etoken2.allowance.call(holder, spender, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), resultValue);
    });
  });
  it('should return (2**256 - 2) allowance after another transfer', () => {
    var holder = accounts[0];
    var spender = accounts[1];
    var value = UINT_256_MINUS_1;
    var transfer = 1;
    var resultValue = UINT_256_MINUS_2;
    return etoken2.issueAsset(SYMBOL, value, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(() => {
      return etoken2.approve(spender, value, SYMBOL);
    }).then(() => {
      return etoken2.transferFrom(holder, spender, transfer, SYMBOL, {from: spender});
    }).then(() => {
      return etoken2.allowance.call(holder, spender, SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), resultValue);
    });
  });

  it('should not allow proxy transfer froms from user contracts', () => {
    return etoken2.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, true, {from: accounts[1]}).then(() => {
      return etoken2.__enableProxyCheck();
    }).then(() => {
      return etoken2.approve(accounts[0], VALUE, SYMBOL, {from: accounts[1]});
    }).then(() => {
      return userContract.proxyTransferFromWithReference(accounts[1], accounts[2], VALUE, SYMBOL, '', accounts[0]);
    }).then(() => {
      return etoken2.balanceOf.call(accounts[1], SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), VALUE);
      return etoken2.balanceOf.call(accounts[2], SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), 0);
      return etoken2.allowance.call(accounts[1], accounts[0], SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), VALUE);
    });
  });
  it('should not allow proxy approves from user contracts', () => {
    return etoken2.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, true).then(() => {
      return etoken2.__enableProxyCheck();
    }).then(() => {
      return userContract.proxyApprove(accounts[1], VALUE, SYMBOL, accounts[0]);
    }).then(() => {
      return etoken2.allowance.call(accounts[0], accounts[1], SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), 0);
      return etoken2.allowance.call(userContract.address, accounts[1], SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), 0);
    });
  });
  it('should not allow proxy transfers from to ICAP from user contracts', () => {
    let icap;
    const _icap = 'XE73TSTXREG123456789';
    return RegistryICAPTestable.deployed().then(instance => {
      icap = instance;
      return etoken2.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, true);
    }).then(() => {
      return etoken2.__enableProxyCheck();
    }).then(() => {
      return etoken2.setupRegistryICAP(icap.address);
    }).then(() => {
      return icap.registerAsset('TST', SYMBOL);
    }).then(() => {
      return icap.registerInstitution('XREG', accounts[2]);
    }).then(() => {
      return icap.registerInstitutionAsset('TST', 'XREG', accounts[2], {from: accounts[2]});
    }).then(() => {
      return userContract.proxyTransferFromToICAPWithReference(accounts[0], _icap, VALUE, '', accounts[0]);
    }).then(() => {
      return etoken2.balanceOf.call(accounts[0], SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), VALUE);
      return etoken2.balanceOf.call(accounts[2], SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), 0);
    });
  });

  it('should be possible to switch off asset issue', () => {
    return etoken2.enableSwitch(sha3(SYMBOL, IS_REISSUABLE, Features.Issue)).then((res) => {
      return etoken2.issueAsset.call(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE);
    }).then(result => {
      assert.isFalse(result.valueOf());
    });
  });
  it('should be possible to switch off transfer with reference', () => {
    return etoken2.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(() => {
      return etoken2.enableSwitch(sha3(SYMBOL, Features.TransferWithReference));
    }).then(() => {
      return etoken2.transferWithReference.call(accounts[1], VALUE, SYMBOL, 'Invoice#AS001');
    }).then(result => {
      assert.isFalse(result.valueOf());
    });
  });
  it('should be possible to switch off transfer from with reference', () => {
    return etoken2.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(() => {
      return etoken2.enableSwitch(sha3(SYMBOL, Features.TransferWithReference));
    }).then(() => {
      return etoken2.approve(accounts[1], 100, SYMBOL);
    }).then(result => {
      return etoken2.transferFromWithReference.call(accounts[0], accounts[1], 50, SYMBOL, 'Invoice#AS001', {from: accounts[1]});
    }).then(result => {
      assert.isFalse(result.valueOf());
    });
  });
  it('should be possible to switch off revokation', () => {
    return etoken2.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(() => {
      return etoken2.enableSwitch(sha3(SYMBOL, Features.Revoke));
    }).then(() => {
      return etoken2.revokeAsset.call(SYMBOL, 100);
    }).then(result => {
      assert.isFalse(result.valueOf());
    });
  });
  it('should be possible to switch off ownership change', () => {
    return etoken2.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(() => {
      return etoken2.enableSwitch(sha3(SYMBOL, Features.ChangeOwnership));
    }).then(() => {
      return etoken2.changeOwnership.call(SYMBOL, accounts[1]);
    }).then(result => {
      assert.isFalse(result.valueOf());
    });
  });
  it('should be possible to switch off allowances', () => {
    return etoken2.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(() => {
      return etoken2.enableSwitch(sha3(SYMBOL, Features.Allowances));
    }).then(() => {
      return etoken2.approve.call(accounts[1], 100, SYMBOL);
    }).then(result => {
      assert.isFalse(result.valueOf());
    });
  });
  it('should be possible to switch off transfer to ICAP', () => {
    let icap;
    return RegistryICAPTestable.deployed().then(instance => {
      icap = instance;
      return etoken2.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE);
    }).then(() => {
      return etoken2.setupRegistryICAP(icap.address);
    }).then(() => {
      return icap.registerAsset('TST', SYMBOL);
    }).then(() => {
      return icap.registerInstitution('XREG', accounts[2]);
    }).then(() => {
      return icap.registerInstitutionAsset('TST', 'XREG', accounts[2], {from: accounts[2]});
    }).then(() => {
      return etoken2.enableSwitch(sha3(SYMBOL, Features.ICAP));
    }).then(() => {
      return etoken2.transferToICAP.call('XE73TSTXREG123456789', 100);
    }).then(result => {
      assert.isFalse(result.valueOf());
    });
  });
  it('should be possible to switch off transfer to ICAP with reference', () => {
    let icap;
    return RegistryICAPTestable.deployed().then(instance => {
      icap = instance;
      return etoken2.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE);
    }).then(() => {
      return etoken2.setupRegistryICAP(icap.address);
    }).then(() => {
      return icap.registerAsset('TST', SYMBOL);
    }).then(() => {
      return icap.registerInstitution('XREG', accounts[2]);
    }).then(() => {
      return icap.registerInstitutionAsset('TST', 'XREG', accounts[2], {from: accounts[2]});
    }).then(() => {
      return etoken2.enableSwitch(sha3(SYMBOL, Features.TransferWithReference));
    }).then(() => {
      return etoken2.transferToICAPWithReference.call('XE73TSTXREG123456789', 100, 'Ref');
    }).then(result => {
      assert.isFalse(result.valueOf());
    });
  });

  it('should be possible to do transfer to ICAP', () => {
    const _icap = 'XE73TSTXREG123456789';
    let icap;
    return RegistryICAPTestable.deployed().then(instance => {
      icap = instance;
      return etoken2.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE);
    }).then(() => {
      return etoken2.setupRegistryICAP(icap.address);
    }).then(() => {
      return icap.registerAsset('TST', SYMBOL);
    }).then(() => {
      return icap.registerInstitution('XREG', accounts[2]);
    }).then(() => {
      return icap.registerInstitutionAsset('TST', 'XREG', accounts[2], {from: accounts[2]});
    }).then(() => {
      return etoken2.transferToICAP(_icap, 100);
    }).then(tx => getEvents(tx, 'TransferToICAP')).then(events => {
      assert.equal(events.length, 1);
      assert.equal(events[0].args.from.valueOf(), accounts[0]);
      assert.equal(events[0].args.to.valueOf(), accounts[2]);
      assert.equal(web3.toAscii(events[0].args.icap.valueOf().substr(0, 42)), _icap);
      assert.equal(events[0].args.value.toNumber(), 100);
      assert.equal(events[0].args.reference.valueOf(), '');
    }).then(() => {
      return etoken2.balanceOf(accounts[2], SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), 100);
      return etoken2.balanceOf(accounts[0], SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), VALUE-100);
    });
  });
  it('should be possible to do transfer to ICAP with reference', () => {
    const _icap = 'XE73TSTXREG123456789';
    let icap;
    return RegistryICAPTestable.deployed().then(instance => {
      icap = instance;
      return etoken2.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE);
    }).then(() => {
      return etoken2.setupRegistryICAP(icap.address);
    }).then(() => {
      return icap.registerAsset('TST', SYMBOL);
    }).then(() => {
      return icap.registerInstitution('XREG', accounts[2]);
    }).then(() => {
      return icap.registerInstitutionAsset('TST', 'XREG', accounts[2], {from: accounts[2]});
    }).then(() => {
      return etoken2.transferToICAPWithReference(_icap, 100, 'Ref');
    }).then(tx => getEvents(tx, 'TransferToICAP')).then(events => {
      assert.equal(events.length, 1);
      assert.equal(events[0].args.from.valueOf(), accounts[0]);
      assert.equal(events[0].args.to.valueOf(), accounts[2]);
      assert.equal(web3.toAscii(events[0].args.icap.valueOf().substr(0, 42)), _icap);
      assert.equal(events[0].args.value.toNumber(), 100);
      assert.equal(events[0].args.reference.valueOf(), 'Ref');
    }).then(() => {
      return etoken2.balanceOf(accounts[2], SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), 100);
      return etoken2.balanceOf(accounts[0], SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), VALUE-100);
    });
  });
  it('should be possible to do transfer from to ICAP', () => {
    const _icap = 'XE73TSTXREG123456789';
    let icap;
    return RegistryICAPTestable.deployed().then(instance => {
      icap = instance;
      return etoken2.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE);
    }).then(() => {
      return etoken2.setupRegistryICAP(icap.address);
    }).then(() => {
      return icap.registerAsset('TST', SYMBOL);
    }).then(() => {
      return icap.registerInstitution('XREG', accounts[2]);
    }).then(() => {
      return icap.registerInstitutionAsset('TST', 'XREG', accounts[2], {from: accounts[2]});
    }).then(() => {
      return etoken2.approve(accounts[1], 200, SYMBOL);
    }).then(() => {
      return etoken2.transferFromToICAP(accounts[0], _icap, 100, {from: accounts[1]});
    }).then(tx => getEvents(tx, 'TransferToICAP')).then(events => {
      assert.equal(events.length, 1);
      assert.equal(events[0].args.from.valueOf(), accounts[0]);
      assert.equal(events[0].args.to.valueOf(), accounts[2]);
      assert.equal(web3.toAscii(events[0].args.icap.valueOf().substr(0, 42)), _icap);
      assert.equal(events[0].args.value.toNumber(), 100);
      assert.equal(events[0].args.reference.valueOf(), '');
    }).then(() => {
      return etoken2.balanceOf(accounts[2], SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), 100);
      return etoken2.balanceOf(accounts[0], SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), VALUE-100);
      return etoken2.allowance(accounts[0], accounts[1], SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), 100);
    });
  });
  it('should be possible to do transfer from to ICAP with reference', () => {
    const _icap = 'XE73TSTXREG123456789';
    let icap;
    return RegistryICAPTestable.deployed().then(instance => {
      icap = instance;
      return etoken2.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE);
    }).then(() => {
      return etoken2.setupRegistryICAP(icap.address);
    }).then(() => {
      return icap.registerAsset('TST', SYMBOL);
    }).then(() => {
      return icap.registerInstitution('XREG', accounts[2]);
    }).then(() => {
      return icap.registerInstitutionAsset('TST', 'XREG', accounts[2], {from: accounts[2]});
    }).then(() => {
      return etoken2.approve(accounts[1], 200, SYMBOL);
    }).then(() => {
      return etoken2.transferFromToICAPWithReference(accounts[0], _icap, 100, 'Ref', {from: accounts[1]});
    }).then(tx => getEvents(tx, 'TransferToICAP')).then(events => {
      assert.equal(events.length, 1);
      assert.equal(events[0].args.from.valueOf(), accounts[0]);
      assert.equal(events[0].args.to.valueOf(), accounts[2]);
      assert.equal(web3.toAscii(events[0].args.icap.valueOf().substr(0, 42)), _icap);
      assert.equal(events[0].args.value.toNumber(), 100);
      assert.equal(events[0].args.reference.valueOf(), 'Ref');
    }).then(() => {
      return etoken2.balanceOf(accounts[2], SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), 100);
      return etoken2.balanceOf(accounts[0], SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), VALUE-100);
      return etoken2.allowance(accounts[0], accounts[1], SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), 100);
    });
  });

  it('should be possible to check is locked', () => {
    return etoken2.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(() => {
      return etoken2.isLocked.call(SYMBOL);
    }).then(result => {
      assert.isFalse(result);
    });
  });
  it('should be possible to lock asset', () => {
    return etoken2.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(() => {
      return etoken2.lockAsset(SYMBOL);
    }).then(() => {
      return etoken2.isLocked.call(SYMBOL);
    }).then(result => {
      assert.isTrue(result);
    });
  });
  it('should not be possible to change asset after lock', () => {
    return etoken2.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(() => {
      return etoken2.lockAsset(SYMBOL);
    }).then(() => {
      return etoken2.changeAsset(SYMBOL, 'New name', 'New description', 100);
    }).then(() => {
      return etoken2.name.call(SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), NAME);
      return etoken2.description.call(SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), DESCRIPTION);
      return etoken2.baseUnit.call(SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), BASE_UNIT);
    });
  });
  it('should be possible to change asset before lock', () => {
    const newName = 'New name';
    const newDescription = 'New description';
    const newBaseUnit = 100;
    return etoken2.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(() => {
      return etoken2.changeAsset(SYMBOL, newName, newDescription, newBaseUnit);
    }).then(tx => getEvents(tx, 'Change')).then(events => {
      assert.equal(events.length, 1);
      assert.equal(events[0].args.symbol.valueOf(), SYMBOL);
      return etoken2.name.call(SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), newName);
      return etoken2.description.call(SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), newDescription);
      return etoken2.baseUnit.call(SYMBOL);
    }).then(result => {
      assert.equal(result.valueOf(), newBaseUnit);
    });
  });
});
