pragma solidity 0.4.8;

import "./Ambi2EnabledFull.sol";

contract OwnedInterface {
    function changeContractOwnership(address _to) returns(bool);
    function claimContractOwnership() returns(bool);
}

contract OwnedProxy is Ambi2EnabledFull {
    address public ownedProxyTarget;
    bytes32 constant PROXY_OWNER = 'proxyOwner';

    function OwnedProxy(address _target) {
        ownedProxyTarget = _target;
    }

    function changeContractOwnership(address _to) onlyRole(PROXY_OWNER) returns(bool) {
        return OwnedInterface(ownedProxyTarget).changeContractOwnership(_to);
    }

    function claimContractOwnership() onlyRole(PROXY_OWNER) returns(bool) {
        return OwnedInterface(ownedProxyTarget).claimContractOwnership();
    }

    function () onlyRole(PROXY_OWNER) {
        address addr = ownedProxyTarget;
        assembly {
            let datastart := add(msize, 1)
            calldatacopy(datastart, 0, calldatasize)
            pop(call(div(mul(gas, 63), 64), addr, 0, datastart, calldatasize, 0, 32))
            return(0, 32)
        }
    }
}
