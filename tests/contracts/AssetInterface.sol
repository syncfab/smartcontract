pragma solidity 0.4.8;

contract AssetInterface {
    function _performTransferWithReference(address _to, uint _value, string _reference, address _sender) returns(bool);
    function _performTransferToICAPWithReference(bytes32 _icap, uint _value, string _reference, address _sender) returns(bool);
    function _performApprove(address _spender, uint _value, address _sender) returns(bool);    
    function _performTransferFromWithReference(address _from, address _to, uint _value, string _reference, address _sender) returns(bool);
    function _performTransferFromToICAPWithReference(address _from, bytes32 _icap, uint _value, string _reference, address _sender) returns(bool);
    function _performGeneric(bytes _data, address _sender) payable returns(bytes32) {
        throw;
    }
}
