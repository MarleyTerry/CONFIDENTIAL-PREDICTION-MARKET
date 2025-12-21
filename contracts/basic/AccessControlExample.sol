// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import "@fhevm/solidity/lib/FHE.sol";

/// @title Access Control Example
/// @notice Demonstrates FHE.allowThis() and FHE.allow() patterns
contract AccessControlExample {
  /// @dev Map of user addresses to their encrypted secrets
  mapping(address => euint32) private _userSecrets;

  event SecretStored(address indexed user, uint256 timestamp);
  event SecretAccessed(address indexed user, address indexed accessor, uint256 timestamp);

  /// @notice Stores an encrypted secret for caller
  /// @dev Shows both FHE.allowThis() and FHE.allow() usage
  function storeSecret(externalEuint32 encryptedSecret, bytes calldata inputProof) external {
    euint32 secret = FHE.fromExternal(encryptedSecret, inputProof);

    _userSecrets[msg.sender] = secret;

    // ✅ CORRECT: Set both permissions
    // This allows the contract AND the user to access the value
    FHE.allowThis(secret);        // Contract can access
    FHE.allow(secret, msg.sender); // User can access

    emit SecretStored(msg.sender, block.timestamp);
  }

  /// @notice Returns encrypted secret for caller
  /// @dev Only returns the value, caller already has permission to it
  function getOwnSecret() external view returns (euint32) {
    return _userSecrets[msg.sender];
  }

  /// @notice Transfers encrypted secret to another user with permission
  /// @dev Demonstrates delegation of access
  function delegateSecret(address recipient) external {
    euint32 secret = _userSecrets[msg.sender];
    require(secret != euint32.wrap(0), "No secret to delegate");

    // Set new permissions for recipient
    FHE.allow(secret, recipient);

    emit SecretAccessed(msg.sender, recipient, block.timestamp);
  }

  // ❌ COMMON MISTAKES - What NOT to do:

  // Mistake 1: Missing FHE.allowThis()
  // This would fail:
  // function storeSecretWrong1(uint32 publicSecret) external {
  //   euint32 secret = FHE.asEuint32(publicSecret);
  //   FHE.allow(secret, msg.sender);  // User permission only
  //   _userSecrets[msg.sender] = secret;
  //   // ❌ When contract tries to return this, it will fail
  // }

  // Mistake 2: Missing FHE.allow()
  // This would fail:
  // function storeSecretWrong2(uint32 publicSecret) external {
  //   euint32 secret = FHE.asEuint32(publicSecret);
  //   FHE.allowThis(secret);  // Contract permission only
  //   _userSecrets[msg.sender] = secret;
  //   // ❌ User cannot decrypt their own secret
  // }

  // Mistake 3: Wrong timing of permissions
  // This would fail:
  // function storeSecretWrong3(uint32 publicSecret) external {
  //   euint32 secret = FHE.asEuint32(publicSecret);
  //   _userSecrets[msg.sender] = secret;
  //   // ❌ Trying to set permissions AFTER storage
  //   FHE.allowThis(secret);
  //   FHE.allow(secret, msg.sender);
  // }
}
