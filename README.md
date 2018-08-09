# MFG Smart Contract
The MFG Token is a utility token used on the SyncFab platform to reward purchasers and manufacturers, make payments, protect intellectual properties, promote trust and transparency through the execution of smart contracts on the blockchain

![](https://i.imgur.com/atJ8w8a.png)

```
./contracts folder contains all the contracts that are related to token generation.
./tests folder contains the same contracts plus some others for reference, and tests.
./contracts/standalone folder contains following 6 contracts as a single, standalone files for easier compilation.

AssetWithRevert.sol deployed at 0x3f107d2e732f78275d43e60c43d654a14d9a901b and verified on Etherscan
EToken2.sol ByteCode identical with deployed 0x331d077518216c07C87f4f18bA64cd384c411F84 contract, compiler 0.4.8+commit.60cc1668, enabled optimization, 200 runs;
Ambi2.sol ByteCode identical with deployed 0x48681684FfcC808C10E519364d31B73662B3e333 contract, compiler 0.4.8+commit.60cc1668, enabled optimization, 200 runs;
EToken2Emitter.sol ByteCode identical with deployed 0xE8C051e1647A19Fbb0F94e3Cd3FcE074AE3C333D contract, compiler 0.4.8+commit.60cc1668, enabled optimization, 200 runs;
EventsHistory.sol ByteCode identical with deployed 0x60bf91ac87fEE5A78c28F7b67701FBCFA79C18EC contract, 0.3.5-nightly.2016.7.1+commit.48238c9, enabled optimization, 200 runs;
RegistryICAP.sol ByteCode identical with deployed 0x96a51938CFB22565E0d40694Fe103675c63AE218 contract, 0.3.5-nightly.2016.7.1+commit.48238c9, enabled optimization, 200 runs;
MultiAssetEmitter.sol ByteCode identical with deployed 0x4E8703a59FEc01A97d4d2D76271E4F086dbB52Fc contract, 0.3.5-nightly.2016.7.1+commit.48238c9, enabled optimization, 200 runs;


EToken2 is the main asset platform.
It talks to EventsHistory to store events, which in turn asks MultiAssetEmitter and EToken2Emitter for event definitions.
EventsHistory uses Ambi for admin access checks.
It talks to RegistryICAP to resolve ICAP addresses.
RegistryICAP uses Ambi for admin access checks.
It uses Ambi2 for admin access checks.
It talks to SyncFab (deployed separately for every asset) which in turn talks to Asset[AssetWithRevert] (deployed separately).

SyncFab is the ERC20 to EToken2 interface contract, entry point for asset users.
```


# Running tests

```
$ npm run testrpc
$ npm run test
```

![](https://image.prntscr.com/image/sGG79jOMTFmWdkCvrbqsIA.png)
![](https://image.prntscr.com/image/O3q5RS4ZScyn1xlgV6rEPQ.png)
![](https://image.prntscr.com/image/wlLHucRYRAK1eichSKgjTg.png)
![](https://image.prntscr.com/image/zPgcDc5mRJaEMK3u8LhbDw.png)
![](https://image.prntscr.com/image/0yeIsCO4T_2pF_NQsSGwfQ.png)