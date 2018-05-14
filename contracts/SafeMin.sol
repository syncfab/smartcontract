pragma solidity 0.4.8;

contract SafeMin {
    modifier immutable(address _address) {
        if (_address == 0) {
            _;
        }
    }

    function _safeFalse() internal returns(bool) {
        if (msg.value != 0) {
            _safeSend(msg.sender, msg.value);
        }
        return false;
    }

    function _safeSend(address _to, uint _value) internal {
        if (!_unsafeSend(_to, _value)) {
            throw;
        }
    }

    function _unsafeSend(address _to, uint _value) internal returns(bool) {
        return _to.call.value(_value)();
    }
}
