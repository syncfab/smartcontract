pragma solidity 0.4.8;

import '../AssetProxy.sol';

contract AssetProxyTestable is AssetProxy {
    modifier onlyAssetOwner() {
        _;
    }
}
