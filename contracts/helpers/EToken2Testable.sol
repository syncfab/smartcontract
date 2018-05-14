pragma solidity 0.4.8;

import '../EToken2.sol';
import './Ambi2EnabledFake.sol';

// For testing purposes.
contract EToken2Testable is EToken2, Ambi2EnabledFake {
    bool public __proxyCheck;

    function isEnabled(bytes32 _switch) constant returns(bool) {
        return !switches[_switch];
    }

    function _isProxy(bytes32 _symbol) constant internal returns(bool) {
        return __proxyCheck ? super._isProxy(_symbol) : true;
    }

    function __enableProxyCheck() {
        __proxyCheck = true;
    }

    function transfer(address _to, uint _value, bytes32 _symbol) returns(bool) {
        return transferWithReference(_to, _value, _symbol, '');
    }

    function transferWithReference(address _to, uint _value, bytes32 _symbol, string _reference) returns(bool) {
        return _transfer(getHolderId(msg.sender), _createHolderId(_to), _value, _symbol, _reference, getHolderId(msg.sender));
    }

    function approve(address _spender, uint _value, bytes32 _symbol) returns(bool) {
        return _approve(_createHolderId(_spender), _value, _symbol, _createHolderId(msg.sender));
    }

    function transferFrom(address _from, address _to, uint _value, bytes32 _symbol) returns(bool) {
        return transferFromWithReference(_from, _to, _value, _symbol, '');
    }

    function transferFromWithReference(address _from, address _to, uint _value, bytes32 _symbol, string _reference) returns(bool) {
        return _transfer(getHolderId(_from), _createHolderId(_to), _value, _symbol, _reference, getHolderId(msg.sender));
    }

    function transferToICAP(bytes32 _icap, uint _value) returns(bool) {
        return transferToICAPWithReference(_icap, _value, '');
    }
    
    function transferToICAPWithReference(bytes32 _icap, uint _value, string _reference) returns(bool) {
        return _transferToICAP(getHolderId(msg.sender), _icap, _value, _reference, getHolderId(msg.sender));
    }

    function transferFromToICAP(address _from, bytes32 _icap, uint _value) returns(bool) {
        return transferFromToICAPWithReference(_from, _icap, _value, '');
    }

    function transferFromToICAPWithReference(address _from, bytes32 _icap, uint _value, string _reference) returns(bool) {
        return _transferToICAP(getHolderId(_from), _icap, _value, _reference, getHolderId(msg.sender));
    }

    uint public signChecks;
    bytes32 public lastOperation;

    modifier checkSigned(uint _holderId, uint _required) {
        signChecks++;
        lastOperation = sha3(msg.data, _holderId);
        if (!isCosignerSet(_holderId) || _checkSigned(holders[_holderId].cosigner, _holderId, _required)) {
            _;
        } else {
            _error('Cosigner: access denied');
        }
    }
}
