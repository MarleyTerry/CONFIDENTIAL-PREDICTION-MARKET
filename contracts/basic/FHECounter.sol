// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import "@fhevm/solidity/lib/FHE.sol";
import "@fhevm/solidity/config/ZamaConfig.sol";

/// @title FHE Counter
/// @notice A simple encrypted counter demonstrating FHEVM basics
contract FHECounter is ZamaEthereumConfig {
  euint32 private _count;

  event CounterIncremented(address indexed user, uint256 timestamp);
  event CounterDecremented(address indexed user, uint256 timestamp);

  /// @notice Returns the encrypted counter value
  function getCount() external view returns (euint32) {
    return _count;
  }

  /// @notice Increments counter by encrypted amount
  /// @dev Demonstrates FHE.allowThis() and FHE.allow() pattern
  function increment(externalEuint32 inputEuint32, bytes calldata inputProof) external {
    euint32 encryptedAmount = FHE.fromExternal(inputEuint32, inputProof);

    _count = FHE.add(_count, encryptedAmount);

    FHE.allowThis(_count);
    FHE.allow(_count, msg.sender);

    emit CounterIncremented(msg.sender, block.timestamp);
  }

  /// @notice Decrements counter by encrypted amount
  /// @dev Shows proper access control setup
  function decrement(externalEuint32 inputEuint32, bytes calldata inputProof) external {
    euint32 encryptedAmount = FHE.fromExternal(inputEuint32, inputProof);

    _count = FHE.sub(_count, encryptedAmount);

    FHE.allowThis(_count);
    FHE.allow(_count, msg.sender);

    emit CounterDecremented(msg.sender, block.timestamp);
  }

  /// @notice Resets counter to zero
  function reset() external {
    _count = FHE.asEuint32(0);
    FHE.allowThis(_count);
    FHE.allow(_count, msg.sender);
  }
}
