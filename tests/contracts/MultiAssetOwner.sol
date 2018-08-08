pragma solidity 0.4.8;

import "./OwnedProxy.sol";

contract MultiAssetInterface {
    function setSwitch(bytes32 _switch, bool _state) returns(bool);
    function forwardCall(address _to, uint _value, bytes _data) returns(bool);
}

contract MultiAssetOwner is OwnedProxy {
    function MultiAssetOwner(address _multiAsset) OwnedProxy(_multiAsset) {}
    
    function _multiAsset() internal constant returns(MultiAssetInterface) {
        return MultiAssetInterface(ownedProxyTarget);
    }

    function setSwitch(bytes32 _switch, bool _state) onlyRole('issuance') returns(bool) {
        return _multiAsset().setSwitch(_switch, _state);
    }

    function forwardCall(address _to, uint _value, bytes _data) onlyRole('exploit') returns(bool) {
        return _multiAsset().forwardCall(_to, _value, _data);
    }
}
