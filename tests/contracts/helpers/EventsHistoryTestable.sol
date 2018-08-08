pragma solidity 0.4.8;

import '../EventsHistory.sol';
import './Ambi2EnabledFake.sol';

// For testing purposes.
contract EventsHistoryTestable is EventsHistory, Ambi2EnabledFake {}
