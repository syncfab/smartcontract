pragma solidity 0.4.15;

contract RegistryICAPInterface {
  function parse(bytes32 _icap) constant returns(address, bytes32, bool);
  function institutions(bytes32 _institution) constant returns(address);
}

