pragma solidity 0.4.8;

contract AssetProxyInterface {
    function _forwardApprove(address _spender, uint _value, address _sender) returns(bool);    
    function _forwardTransferFromWithReference(address _from, address _to, uint _value, string _reference, address _sender) returns(bool);
    function _forwardTransferFromToICAPWithReference(address _from, bytes32 _icap, uint _value, string _reference, address _sender) returns(bool);
}
