const Reverter = require('./helpers/reverter');
const decodeLogs = require('./helpers/decodelogs');
const bytes32 = require('./helpers/bytes32');

const EToken2Testable = artifacts.require('./EToken2Testable.sol');
const RegistryICAPTestable = artifacts.require('./RegistryICAPTestable.sol');
const UserContract = artifacts.require('./UserContract.sol');
const Stub = artifacts.require('./Stub.sol');
const Listener = artifacts.require('./Listener.sol');
const SyncFab = artifacts.require('./SyncFab.sol');
const Asset = artifacts.require('./Asset.sol');

const assetBase = require('./assetBase');

contract('AssetWithRevert', function(accounts) {
  const SYMBOL = 'TEST';
  const SYMBOL2 = 'TEST2';
  const NAME = 'Test Name';
  const DESCRIPTION = 'Test Description';
  const VALUE = 1001;
  const VALUE2 = 30000;
  const BASE_UNIT = 2;
  const IS_REISSUABLE = false;

  const reverter = new Reverter(web3);
  afterEach('revert', reverter.revert);

  before('setup others', function() {
    this.Listener = Listener;
    this.UserContract = UserContract;
    this.SyncFab = SyncFab;
    return EToken2Testable.deployed().then(instance => {
      this.etoken2 = instance;
      return SyncFab.deployed();
    }).then(instance => {
      this.assetProxy = instance;
      return Asset.deployed();
    }).then(instance => {
      this.asset = instance;
      return RegistryICAPTestable.deployed();
    }).then(instance => {
      this.icap = instance;
      return Stub.deployed();
    }).then(instance => {
      return this.etoken2.setupEventsHistory(instance.address);
    }).then(() => {
      return this.etoken2.setupRegistryICAP(this.icap.address);
    }).then(() => {
      return this.etoken2.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE);
    }).then(() => {
      return this.etoken2.issueAsset(SYMBOL2, VALUE2, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE);
    }).then(() => {
      return this.etoken2.__enableProxyCheck();
    }).then(() => {
      return this.icap.registerAsset("TST", SYMBOL);
    }).then(() => {
      return this.icap.registerInstitution("XREG", accounts[2]);
    }).then(() => {
      return this.icap.registerInstitutionAsset("TST", "XREG", accounts[2], {from: accounts[2]});
    }).then(() => {
      return this.assetProxy.init(this.etoken2.address, SYMBOL, NAME);
    }).then(() => {
      return this.assetProxy.proposeUpgrade(this.asset.address);
    }).then(() => {
      return this.asset.init(this.assetProxy.address);
    }).then(reverter.snapshot);
  });

  assetBase(accounts);
});
