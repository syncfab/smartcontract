pragma solidity 0.4.15;

contract Bytes32 {
  function _bytes32(string _input) internal constant returns(bytes32 result) {
    assembly {
      result := mload(add(_input, 32))
    }
  }
}

