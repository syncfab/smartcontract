pragma solidity 0.4.8;

import '../SyncFab.sol';

contract AssetProxyTestable is SyncFab {
    modifier onlyAssetOwner() {
        _;
    }
}
