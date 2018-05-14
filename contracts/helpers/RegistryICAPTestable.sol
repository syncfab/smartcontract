pragma solidity 0.4.8;

import '../RegistryICAP.sol';
import './Ambi2EnabledFake.sol';

// For testing purposes.
contract RegistryICAPTestable is RegistryICAP, Ambi2EnabledFake {}
