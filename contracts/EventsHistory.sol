pragma solidity 0.4.8;

import './Ambi2EnabledFull.sol';

/**
 * @title Events History universal contract.
 *
 * Contract serves as an Events storage and version history for a particular contract type.
 * Events appear on this contract address but their definitions provided by other contracts/libraries.
 * Version info is provided for historical and informational purposes.
 *
 * Note: all the non constant functions return false instead of throwing in case if state change
 * didn't happen yet.
 */
contract EventsHistory is Ambi2EnabledFull {
    // Event emitter signature to address with Event definiton mapping.
    mapping(bytes4 => address) public emitters;

    // Calling contract address to version mapping.
    mapping(address => uint) public versions;

    // Version to info mapping.
    mapping(uint => VersionInfo) public versionInfo;

    // Latest verion number.
    uint public latestVersion;

    struct VersionInfo {
        uint block;        // Block number in which version has been introduced.
        address by;        // Contract owner address who added version.
        address caller;    // Address of this version calling contract.
        string name;       // Version name, informative.
        string changelog;  // Version changelog, informative.
    }

    /**
     * Assign emitter address to a specified emit function signature.
     *
     * Can be set only once for each signature, and only by contract owner.
     * Caller contract should be sure that emitter for a particular signature will never change.
     *
     * @param _eventSignature signature of the event emitting function.
     * @param _emitter address with Event definition.
     *
     * @return success.
     */
    function addEmitter(bytes4 _eventSignature, address _emitter) onlyRole('setup') returns(bool) {
        if (emitters[_eventSignature] != 0x0) {
            return false;
        }
        emitters[_eventSignature] = _emitter;
        return true;
    }

    /**
     * Introduce new caller contract version specifing version information.
     *
     * Can be set only once for each caller, and only by contract owner.
     * Name and changelog should not be empty.
     *
     * @param _caller address of the new caller.
     * @param _name version name.
     * @param _changelog version changelog.
     *
     * @return success.
     */
    function addVersion(address _caller, string _name, string _changelog) onlyRole('admin') returns(bool) {
        if (versions[_caller] != 0) {
            return false;
        }
        if (bytes(_name).length == 0) {
            return false;
        }
        if (bytes(_changelog).length == 0) {
            return false;
        }
        uint version = ++latestVersion;
        versions[_caller] = version;
        versionInfo[version] = VersionInfo(block.number, msg.sender, _caller, _name, _changelog);
        return true;
    }

    /**
     * Event emitting fallback.
     *
     * Can be and only called caller with assigned version.
     * Resolves msg.sig to an emitter address, and calls it to emit an event.
     *
     * Throws if emit function signature is not registered, or call failed.
     */
    function () {
        if (versions[msg.sender] == 0) {
            return;
        }
        // Internal Out Of Gas/Throw: revert this transaction too;
        // Call Stack Depth Limit reached: n/a after HF 4;
        // Recursive Call: safe, all changes already made.
        if (!emitters[msg.sig].delegatecall(msg.data)) {
            throw;
        }
    }
}
