pragma solidity 0.4.15;

contract EToken2Interface {
  function registryICAP() constant returns(RegistryICAPInterface);
  function baseUnit(bytes32 _symbol) constant returns(uint8);
  function description(bytes32 _symbol) constant returns(string);
  function owner(bytes32 _symbol) constant returns(address);
  function isOwner(address _owner, bytes32 _symbol) constant returns(bool);
  function totalSupply(bytes32 _symbol) constant returns(uint);
  function balanceOf(address _holder, bytes32 _symbol) constant returns(uint);
  function isLocked(bytes32 _symbol) constant returns(bool);
  function issueAsset(bytes32 _symbol, uint _value, string _name, string _description, uint8 _baseUnit, bool _isReissuable) returns(bool);
  function reissueAsset(bytes32 _symbol, uint _value) returns(bool);
  function revokeAsset(bytes32 _symbol, uint _value) returns(bool);
  function setProxy(address _address, bytes32 _symbol) returns(bool);
  function lockAsset(bytes32 _symbol) returns(bool);
  function proxyTransferFromToICAPWithReference(address _from, bytes32 _icap, uint _value, string _reference, address _sender) returns(bool);
  function proxyApprove(address _spender, uint _value, bytes32 _symbol, address _sender) returns(bool);
  function allowance(address _from, address _spender, bytes32 _symbol) constant returns(uint);
  function proxyTransferFromWithReference(address _from, address _to, uint _value, bytes32 _symbol, string _reference, address _sender) returns(bool);
}

