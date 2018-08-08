pragma solidity 0.4.8;

contract Ambi2Fake {
    mapping(address => 
        mapping(bytes32 =>
            mapping(address => bool))) allowed;
    function claimFor(address _address, address _owner) returns(bool) {
        return true;
    }
    function hasRole(address _from, bytes32 _role, address _to) constant returns(bool) {
        return allowed[_from][_role][_to];
    }
    function setAllowed(address _from, bytes32 _role, address _to) {
        allowed[_from][_role][_to] = true;
    }
}
