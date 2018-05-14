pragma solidity 0.4.8;

contract Ambi2EnabledFake {
    modifier onlyRole(bytes32 _role) {
        _;
    }
}
