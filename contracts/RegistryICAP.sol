pragma solidity 0.4.8;

import './Ambi2EnabledFull.sol';
import './SafeMin.sol';

contract RegistryICAP is Ambi2EnabledFull, SafeMin {
    function decodeIndirect(bytes _bban) constant returns(string, string, string) {
        bytes memory asset = new bytes(3);
        bytes memory institution = new bytes(4);
        bytes memory client = new bytes(9);

        uint8 k = 0;

        for (uint8 i = 0; i < asset.length; i++) {
            asset[i] = _bban[k++];
        }
        for (i = 0; i < institution.length; i++) {
            institution[i] = _bban[k++];
        }
        for (i = 0; i < client.length; i++) {
            client[i] = _bban[k++];
        }
        return (string(asset), string(institution), string(client));
    }

    function parse(bytes32 _icap) constant returns(address, bytes32, bool) {
        // Should start with XE.
        if (_icap[0] != 88 || _icap[1] != 69) {
            return (0, 0, false);
        }
        // Should have 12 zero bytes at the end.
        for (uint8 j = 20; j < 32; j++) {
            if (_icap[j] != 0) {
                return (0, 0, false);
            }
        }
        bytes memory bban = new bytes(18);
        for (uint8 i = 0; i < 16; i++) {
             bban[i] = _icap[i + 4];
        }
        var (asset, institution, _) = decodeIndirect(bban);

        bytes32 assetInstitutionHash = sha3(asset, institution);

        uint8 parseChecksum = (uint8(_icap[2]) - 48) * 10 + (uint8(_icap[3]) - 48);
        uint8 calcChecksum = 98 - mod9710(prepare(bban));
        if (parseChecksum != calcChecksum) {
            return (institutions[assetInstitutionHash], assets[sha3(asset)], false);
        }
        return (institutions[assetInstitutionHash], assets[sha3(asset)], registered[assetInstitutionHash]);
    }

    function prepare(bytes _bban) constant returns(bytes) {
        for (uint8 i = 0; i < 16; i++) {
            uint8 charCode = uint8(_bban[i]);
            if (charCode >= 65 && charCode <= 90) {
                _bban[i] = byte(charCode - 65 + 10);
            }
        }
        _bban[16] = 33; // X
        _bban[17] = 14; // E
        //_bban[18] = 48; // 0
        //_bban[19] = 48; // 0
        return _bban;
    }

    function mod9710(bytes _prepared) constant returns(uint8) {
        uint m = 0;
        for (uint8 i = 0; i < 18; i++) {
            uint8 charCode = uint8(_prepared[i]);
            if (charCode >= 48) {
                m *= 10;
                m += charCode - 48; // number
                m %= 97;
            } else {
                m *= 10;
                m += charCode / 10; // part1
                m %= 97;
                m *= 10;
                m += charCode % 10; // part2
                m %= 97;
            }
        }
        m *= 10;
        //m += uint8(_prepared[18]) - 48;
        m %= 97;
        m *= 10;
        //m += uint8(_prepared[19]) - 48;
        m %= 97;
        return uint8(m);
    }

    mapping(bytes32 => bool) public registered;
    mapping(bytes32 => address) public institutions;
    mapping(bytes32 => address) public institutionOwners;
    mapping(bytes32 => bytes32) public assets;

    modifier onlyInstitutionOwner(string _institution) {
        if (msg.sender == institutionOwners[sha3(_institution)]) {
            _;
        }
    }

    function changeInstitutionOwner(string _institution, address _address) onlyInstitutionOwner(_institution) returns(bool) {
        institutionOwners[sha3(_institution)] = _address;
        return true;
    }

    // web3js sendIBANTransaction interface
    function addr(bytes32 _institution) constant returns(address) {
        return institutions[sha3('ETH', _institution[0], _institution[1], _institution[2], _institution[3])];
    }

    function registerInstitution(string _institution, address _address) onlyRole('admin') returns(bool) {
        if (bytes(_institution).length != 4) {
            return false;
        }
        if (institutionOwners[sha3(_institution)] != 0) {
            return false;
        }
        institutionOwners[sha3(_institution)] = _address;
        return true;
    }

    function registerInstitutionAsset(string _asset, string _institution, address _address) onlyInstitutionOwner(_institution) returns(bool) {
        if (!registered[sha3(_asset)]) {
            return false;
        }
        bytes32 assetInstitutionHash = sha3(_asset, _institution);
        if (registered[assetInstitutionHash]) {
            return false;
        }
        registered[assetInstitutionHash] = true;
        institutions[assetInstitutionHash] = _address;
        return true;
    }

    function updateInstitutionAsset(string _asset, string _institution, address _address) onlyInstitutionOwner(_institution) returns(bool) {
        bytes32 assetInstitutionHash = sha3(_asset, _institution);
        if (!registered[assetInstitutionHash]) {
            return false;
        }
        institutions[assetInstitutionHash] = _address;
        return true;
    }

    function removeInstitutionAsset(string _asset, string _institution) onlyInstitutionOwner(_institution) returns(bool) {
        bytes32 assetInstitutionHash = sha3(_asset, _institution);
        if (!registered[assetInstitutionHash]) {
            return false;
        }
        delete registered[assetInstitutionHash];
        delete institutions[assetInstitutionHash];
        return true;
    }

    function registerAsset(string _asset, bytes32 _symbol) onlyRole('admin') returns(bool) {
        if (bytes(_asset).length != 3) {
            return false;
        }
        bytes32 asset = sha3(_asset);
        if (registered[asset]) {
            return false;
        }
        registered[asset] = true;
        assets[asset] = _symbol;
        return true;
    }
}
