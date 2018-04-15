pragma solidity 0.4.15;

contract ReturnData {
  function _returnReturnData(bool _success) internal {
    assembly {
      let returndatastart := msize()
      mstore(0x40, add(returndatastart, returndatasize))
      returndatacopy(returndatastart, 0, returndatasize)
      switch _success case 0 { revert(returndatastart, returndatasize) } default { return(returndatastart, returndatasize) }
    }
  }

  function _assemblyCall(address _destination, uint _value, bytes _data) internal returns(bool success) {
    assembly {
      success := call(div(mul(gas, 63), 64), _destination, _value, add(_data, 32), mload(_data), 0, 0)
    }
  }
}
