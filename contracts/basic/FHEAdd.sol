// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import "@fhevm/solidity/lib/FHE.sol";

/// @title FHE Add
/// @notice Demonstrates encrypted addition operation
contract FHEAdd {
  euint32 private _result;

  event AdditionPerformed(address indexed user, uint256 timestamp);

  /// @notice Adds two encrypted values and stores result
  /// @dev FHE.add() works on encrypted values without decryption
  function add(
    externalEuint32 encryptedA,
    bytes calldata proofA,
    externalEuint32 encryptedB,
    bytes calldata proofB
  ) external {
    euint32 a = FHE.fromExternal(encryptedA, proofA);
    euint32 b = FHE.fromExternal(encryptedB, proofB);

    // Perform operation on encrypted values
    euint32 sum = FHE.add(a, b);

    _result = sum;

    // Set permissions for result
    FHE.allowThis(sum);
    FHE.allow(sum, msg.sender);

    emit AdditionPerformed(msg.sender, block.timestamp);
  }

  /// @notice Returns the encrypted result
  function getResult() external view returns (euint32) {
    return _result;
  }

  // Additional FHE Operations that follow same pattern:
  // FHE.sub(a, b) - Subtraction
  // FHE.mul(a, b) - Multiplication
  // FHE.div(a, b) - Division
  // FHE.rem(a, b) - Remainder
  // FHE.eq(a, b) - Equality comparison (returns ebool)
  // FHE.lt(a, b) - Less than
  // FHE.le(a, b) - Less than or equal
  // FHE.gt(a, b) - Greater than
  // FHE.ge(a, b) - Greater than or equal
}
