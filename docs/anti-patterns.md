# FHEVM Anti-Patterns and Common Mistakes

This document catalogs common mistakes when working with FHEVM and provides correct patterns to follow.

## Table of Contents

- [Access Control Mistakes](#access-control-mistakes)
- [Input Encryption Issues](#input-encryption-issues)
- [Permission Timing Errors](#permission-timing-errors)
- [Type Mismatches](#type-mismatches)
- [Security Vulnerabilities](#security-vulnerabilities)

## Access Control Mistakes

### ❌ Missing FHE.allowThis()

**Problem**: Contract cannot access encrypted values

```solidity
// INCORRECT
function storeValue(uint32 value) external {
  euint32 encrypted = FHE.asEuint32(value);
  // Missing: FHE.allowThis(encrypted);
  FHE.allow(encrypted, msg.sender);
  _value = encrypted;
  // ❌ When returning, contract cannot access _value
}
```

**Why it fails**: Without `FHE.allowThis()`, the contract doesn't have permission to perform operations on the encrypted value.

**✅ Correct Pattern**:

```solidity
function storeValue(uint32 value) external {
  euint32 encrypted = FHE.asEuint32(value);
  FHE.allowThis(encrypted);  // ✅ Contract can access
  FHE.allow(encrypted, msg.sender);
  _value = encrypted;
}
```

### ❌ Missing FHE.allow()

**Problem**: User cannot decrypt their own values

```solidity
// INCORRECT
function storeValue(uint32 value) external {
  euint32 encrypted = FHE.asEuint32(value);
  FHE.allowThis(encrypted);
  // Missing: FHE.allow(encrypted, msg.sender);
  _value = encrypted;
  // ❌ User cannot decrypt when querying
}
```

**Why it fails**: Without `FHE.allow(encrypted, msg.sender)`, the user who stored the value cannot decrypt it later.

**✅ Correct Pattern**:

```solidity
function storeValue(uint32 value) external {
  euint32 encrypted = FHE.asEuint32(value);
  FHE.allowThis(encrypted);
  FHE.allow(encrypted, msg.sender);  // ✅ User can decrypt
  _value = encrypted;
}
```

### ❌ Wrong Permission Order

**Problem**: Setting permissions after storage can fail

```solidity
// INCORRECT
function storeValue(uint32 value) external {
  euint32 encrypted = FHE.asEuint32(value);
  _value = encrypted;  // Stored first
  // Setting permissions after storage - may not work consistently
  FHE.allowThis(encrypted);
  FHE.allow(encrypted, msg.sender);
}
```

**Why it's problematic**: Permissions should be set immediately after creating encrypted value, before any other operations.

**✅ Correct Pattern**:

```solidity
function storeValue(uint32 value) external {
  euint32 encrypted = FHE.asEuint32(value);
  // Set permissions immediately
  FHE.allowThis(encrypted);
  FHE.allow(encrypted, msg.sender);
  // Then store
  _value = encrypted;
}
```

## Input Encryption Issues

### ❌ Missing Input Proof

**Problem**: Security vulnerability allowing arbitrary encrypted values

```solidity
// INCORRECT - Pseudocode showing the issue
function unsafeInput(euint32 value) external {
  // No input proof verification
  // Anyone could submit arbitrary encrypted values
  _value = value;
}
```

**Why it fails**: Without input proofs, users could submit encrypted values that aren't properly bound to their address, leading to security issues.

**✅ Correct Pattern**:

```solidity
function safeInput(externalEuint32 encryptedInput, bytes calldata inputProof) external {
  // Verify and convert with proof
  euint32 value = FHE.fromExternal(encryptedInput, inputProof);
  FHE.allowThis(value);
  FHE.allow(value, msg.sender);
  _value = value;
}
```

### ❌ Reusing Input Proofs

**Problem**: Input proofs are single-use

```typescript
// INCORRECT
const encryptedInput = await fhevm
  .createEncryptedInput(contractAddress, userAddress)
  .add32(42)
  .encrypt();

// First use - OK
await contract.operation1(encryptedInput.handles[0], encryptedInput.inputProof);

// Second use - FAILS
await contract.operation2(encryptedInput.handles[0], encryptedInput.inputProof);
// ❌ Proof already used
```

**Why it fails**: Input proofs are designed to be single-use for security reasons.

**✅ Correct Pattern**:

```typescript
// Create new encrypted input for each operation
const input1 = await fhevm
  .createEncryptedInput(contractAddress, userAddress)
  .add32(42)
  .encrypt();
await contract.operation1(input1.handles[0], input1.inputProof);

const input2 = await fhevm
  .createEncryptedInput(contractAddress, userAddress)
  .add32(42)
  .encrypt();
await contract.operation2(input2.handles[0], input2.inputProof);
```

## Permission Timing Errors

### ❌ Forgetting to Update Permissions After Operations

**Problem**: Result of encrypted operation has no permissions

```solidity
// INCORRECT
function add(euint32 a, euint32 b) external returns (euint32) {
  euint32 result = FHE.add(a, b);
  // Missing: FHE.allowThis(result);
  // Missing: FHE.allow(result, msg.sender);
  return result;
  // ❌ Caller cannot use the result
}
```

**Why it fails**: Operations create new encrypted values that need their own permissions.

**✅ Correct Pattern**:

```solidity
function add(euint32 a, euint32 b) external returns (euint32) {
  euint32 result = FHE.add(a, b);
  FHE.allowThis(result);  // ✅ Contract can use result
  FHE.allow(result, msg.sender);  // ✅ Caller can use result
  return result;
}
```

### ❌ Not Setting Transient Permissions

**Problem**: Temporary values need permissions too

```solidity
// INCORRECT
function complexOperation(uint32 a, uint32 b) external {
  euint32 temp1 = FHE.asEuint32(a);
  // Missing: FHE.allowThis(temp1);

  euint32 temp2 = FHE.asEuint32(b);
  // Missing: FHE.allowThis(temp2);

  euint32 result = FHE.add(temp1, temp2);  // ❌ May fail
}
```

**✅ Correct Pattern**:

```solidity
function complexOperation(uint32 a, uint32 b) external {
  euint32 temp1 = FHE.asEuint32(a);
  FHE.allowThis(temp1);  // ✅ Set permissions

  euint32 temp2 = FHE.asEuint32(b);
  FHE.allowThis(temp2);  // ✅ Set permissions

  euint32 result = FHE.add(temp1, temp2);
  FHE.allowThis(result);
  FHE.allow(result, msg.sender);
}
```

## Type Mismatches

### ❌ Incorrect Type Casting

**Problem**: Downcasting without checking bounds

```solidity
// INCORRECT
function dangerousConversion(uint256 largeValue) external {
  // Unsafe cast - may overflow
  euint32 encrypted = FHE.asEuint32(uint32(largeValue));
  // ❌ If largeValue > type(uint32).max, data loss occurs
}
```

**✅ Correct Pattern**:

```solidity
function safeConversion(uint256 largeValue) external {
  require(largeValue <= type(uint32).max, "Value too large");
  euint32 encrypted = FHE.asEuint32(uint32(largeValue));
  FHE.allowThis(encrypted);
  FHE.allow(encrypted, msg.sender);
}
```

### ❌ Mixing Encrypted and Plain Types

**Problem**: Cannot directly compare encrypted and plain values

```solidity
// INCORRECT
function compareWrong(euint32 encryptedValue) external view returns (bool) {
  return encryptedValue == 42;  // ❌ Type mismatch
}
```

**✅ Correct Pattern**:

```solidity
function compareCorrect(euint32 encryptedValue) external view returns (ebool) {
  euint32 target = FHE.asEuint32(42);
  return FHE.eq(encryptedValue, target);  // ✅ Returns encrypted bool
}
```

## Security Vulnerabilities

### ❌ Exposing Encrypted Values in View Functions

**Problem**: Encrypted values returned in view functions can't be directly read

```solidity
// INCORRECT - Misunderstanding
function getValueWrong() external view returns (uint32) {
  // ❌ Cannot directly return plaintext from encrypted value
  return uint32(_encryptedValue);  // Doesn't compile/work
}
```

**Note**: This is intentional - encrypted values should remain encrypted. For users to read values, they need proper decryption workflows.

**✅ Correct Pattern**:

```solidity
// Return encrypted value (user decrypts client-side)
function getValue() external view returns (euint32) {
  return _encryptedValue;  // ✅ Returns encrypted handle
}

// For actual decryption:
// 1. User calls getValue() to get encrypted handle
// 2. User decrypts client-side using fhevm.userDecrypt()
// 3. Or use public/threshold decryption for public reveal
```

### ❌ Insufficient Bounds Checking

**Problem**: Not validating input ranges before encryption

```solidity
// INCORRECT
function unsafeBet() external payable {
  // No minimum/maximum checks
  uint32 amount = uint32(msg.value / (0.001 ether));
  euint32 encrypted = FHE.asEuint32(amount);
  // ❌ Could overflow uint32 or be too small
}
```

**✅ Correct Pattern**:

```solidity
function safeBet() external payable {
  require(msg.value >= MIN_BET, "Bet too small");
  require(msg.value <= MAX_BET, "Bet too large");

  uint32 amount = uint32(msg.value / (0.001 ether));
  euint32 encrypted = FHE.asEuint32(amount);
  FHE.allowThis(encrypted);
  FHE.allow(encrypted, msg.sender);
}
```

### ❌ Reentrancy with Encrypted Values

**Problem**: Standard reentrancy issues still apply

```solidity
// INCORRECT
function unsafeClaim(uint256 marketId) external {
  euint32 winnings = calculateWinnings(marketId);
  // External call before state update
  (bool success, ) = msg.sender.call{value: winnings}("");  // ❌ Reentrancy risk
  require(success);
  _claimed[marketId][msg.sender] = true;  // Too late
}
```

**✅ Correct Pattern**:

```solidity
function safeClaim(uint256 marketId) external {
  require(!_claimed[marketId][msg.sender], "Already claimed");
  _claimed[marketId][msg.sender] = true;  // ✅ State update first

  uint256 winnings = calculateWinnings(marketId);
  payable(msg.sender).transfer(winnings);  // ✅ External call after
}
```

## Testing Anti-Patterns

### ❌ Not Checking for FHEVM Mock

**Problem**: Tests fail on testnet

```typescript
// INCORRECT
describe("Contract", function () {
  beforeEach(async function () {
    // No mock check - will fail on real network
    const factory = await ethers.getContractFactory("Contract");
    contract = await factory.deploy();
  });
});
```

**✅ Correct Pattern**:

```typescript
describe("Contract", function () {
  beforeEach(async function () {
    if (!fhevm.isMock) {
      console.warn("This test suite runs on FHEVM mock only");
      this.skip();
    }

    const factory = await ethers.getContractFactory("Contract");
    contract = await factory.deploy();
  });
});
```

### ❌ Not Using Proper Decryption in Tests

**Problem**: Trying to directly access encrypted values

```typescript
// INCORRECT
it("should increment counter", async function () {
  await contract.increment(encryptedInput.handles[0], encryptedInput.inputProof);

  const count = await contract.getCount();
  expect(count).to.equal(1);  // ❌ count is encrypted, not plaintext
});
```

**✅ Correct Pattern**:

```typescript
it("should increment counter", async function () {
  await contract.increment(encryptedInput.handles[0], encryptedInput.inputProof);

  const encryptedCount = await contract.getCount();
  const decryptedCount = await fhevm.userDecryptEuint(
    FhevmType.euint32,
    encryptedCount,
    contractAddress,
    userSigner
  );
  expect(decryptedCount).to.equal(1);  // ✅ Compare decrypted value
});
```

## Best Practices Summary

### Always Do:

1. ✅ Set `FHE.allowThis()` for contract access
2. ✅ Set `FHE.allow(value, user)` for user access
3. ✅ Use input proofs with `FHE.fromExternal()`
4. ✅ Set permissions immediately after creating encrypted values
5. ✅ Update permissions after encrypted operations
6. ✅ Validate input bounds before encryption
7. ✅ Use checks-effects-interactions pattern
8. ✅ Test with FHEVM mock mode
9. ✅ Decrypt properly in tests

### Never Do:

1. ❌ Skip FHE.allowThis() or FHE.allow()
2. ❌ Reuse input proofs
3. ❌ Mix encrypted and plain types without conversion
4. ❌ Forget bounds checking
5. ❌ Expose encrypted values directly as plaintext
6. ❌ Make external calls before state updates
7. ❌ Assume encrypted values are zero-initialized
8. ❌ Try to directly compare encrypted and plain values

## Resources

- [FHEVM Documentation](https://docs.zama.ai/fhevm)
- [Access Control Guide](https://docs.zama.ai/fhevm/fundamentals/acl)
- [Input Verification](https://docs.zama.ai/fhevm/fundamentals/inputs)

## Contributing

Found a new anti-pattern? Please submit an issue or PR with:
- Description of the problem
- Code example showing incorrect usage
- Correct pattern
- Explanation of why it fails

---

**Last Updated**: December 2025
**Maintained for**: Zama FHEVM Bounty Program
