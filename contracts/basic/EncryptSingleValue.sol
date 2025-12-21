// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import "@fhevm/solidity/lib/FHE.sol";

/// @title Encrypt Single Value
/// @notice Demonstrates encryption of a single value in FHEVM
contract EncryptSingleValue {
  euint32 private _encryptedValue;
  address private _lastSetter;

  event ValueEncrypted(address indexed setter, uint256 timestamp);

  /// @notice Stores an encrypted value
  /// @dev Key pattern: Accept input, encrypt, set permissions
  function setValue(externalEuint32 encryptedInput, bytes calldata inputProof) external {
    euint32 value = FHE.fromExternal(encryptedInput, inputProof);

    _encryptedValue = value;
    _lastSetter = msg.sender;

    // Critical: Set access permissions
    FHE.allowThis(value);
    FHE.allow(value, msg.sender);

    emit ValueEncrypted(msg.sender, block.timestamp);
  }

  /// @notice Retrieves the encrypted value handle
  /// @return The encrypted value (as handle/bytes32)
  function getValue() external view returns (euint32) {
    return _encryptedValue;
  }

  /// @notice Returns address of last setter
  function getLastSetter() external view returns (address) {
    return _lastSetter;
  }

  // ❌ ANTI-PATTERN: What NOT to do
  // This function demonstrates an incorrect pattern:
  // function setValueWrong(uint32 publicValue) external {
  //   euint32 encrypted = FHE.asEuint32(publicValue);
  //   // Missing: FHE.allowThis(encrypted);
  //   // Missing: FHE.allow(encrypted, msg.sender);
  //   _encryptedValue = encrypted;
  //   // ❌ This would fail when accessing encrypted value
  // }
}
