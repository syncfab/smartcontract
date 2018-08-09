const SyncFab = artifacts.require('./SyncFab.sol');
const AssetProxyTestable = artifacts.require('./AssetProxyTestable.sol');
const Asset = artifacts.require('./Asset.sol');
const MultiAssetOwner = artifacts.require('./MultiAssetOwner.sol');
const EToken2Testable = artifacts.require('./EToken2Testable.sol');
const EToken2Emitter = artifacts.require('./EToken2Emitter.sol');
const EventsHistoryTestable = artifacts.require('./EventsHistoryTestable.sol');
const RegistryICAPTestable = artifacts.require('./RegistryICAPTestable.sol');
const Stub = artifacts.require('./Stub.sol');
const Listener = artifacts.require('./Listener.sol');
const UserContract = artifacts.require('./UserContract.sol');
const Ambi2Fake = artifacts.require('./Ambi2Fake.sol');

module.exports = function(deployer) {
  deployer.deploy(Asset);
  deployer.deploy(SyncFab);
  deployer.deploy(AssetProxyTestable);
  deployer.deploy(EToken2Testable).then(() => deployer.deploy(MultiAssetOwner, EToken2Testable.address));
  deployer.deploy(EToken2Emitter);
  deployer.deploy(EventsHistoryTestable);
  deployer.deploy(RegistryICAPTestable);
  deployer.deploy(Stub);
  deployer.deploy(Listener);
  deployer.deploy(UserContract);
  deployer.deploy(Ambi2Fake);
};
