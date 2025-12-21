# FHEVM Examples Guide

This document provides a complete guide to all FHEVM examples included in this repository.

## Quick Start

### Using Automation Tools

```bash
# Generate standalone example repository
npm run create-example prediction-market ../output/prediction-market

# Generate category-based project (multiple examples)
npm run create-category basic ../output/basic-examples

# Generate documentation
npm run generate-docs prediction-market

# Generate all documentation
npm run generate-all-docs

# Get help
npm run help:examples
npm run help:category
```

## Available Examples

### Basic Examples

#### 1. FHE Counter

**File**: `contracts/basic/FHECounter.sol`

**Demonstrates**:
- Basic encrypted state variable (`euint32`)
- Encrypted arithmetic (`FHE.add`, `FHE.sub`)
- Access control pattern (`FHE.allowThis`, `FHE.allow`)
- Input proofs with `FHE.fromExternal`

**Key Functions**:
```solidity
function increment(externalEuint32 inputEuint32, bytes calldata inputProof) external
function decrement(externalEuint32 inputEuint32, bytes calldata inputProof) external
function getCount() external view returns (euint32)
function reset() external
```

**Usage Example**:
```typescript
// Create encrypted input
const encryptedInput = await fhevm
  .createEncryptedInput(contractAddress, userAddress)
  .add32(5)
  .encrypt();

// Increment counter
await counter.increment(encryptedInput.handles[0], encryptedInput.inputProof);

// Get and decrypt result
const encryptedCount = await counter.getCount();
const decryptedCount = await fhevm.userDecryptEuint(
  FhevmType.euint32,
  encryptedCount,
  contractAddress,
  userSigner
);
```

**Learning Outcomes**:
- How to create and manage encrypted counters
- Proper access control setup
- Working with input proofs
- Decrypting values in tests

---

#### 2. Encrypt Single Value

**File**: `contracts/basic/EncryptSingleValue.sol`

**Demonstrates**:
- Single encrypted value storage
- Input proof verification
- Permission management
- Last setter tracking

**Key Functions**:
```solidity
function setValue(externalEuint32 encryptedInput, bytes calldata inputProof) external
function getValue() external view returns (euint32)
function getLastSetter() external view returns (address)
```

**Usage Example**:
```typescript
const secretValue = 42;

// Create encrypted input with proof
const encryptedInput = await fhevm
  .createEncryptedInput(contractAddress, userAddress)
  .add32(secretValue)
  .encrypt();

// Store encrypted value
await contract.setValue(encryptedInput.handles[0], encryptedInput.inputProof);

// Retrieve and decrypt
const encrypted = await contract.getValue();
const decrypted = await fhevm.userDecryptEuint(
  FhevmType.euint32,
  encrypted,
  contractAddress,
  userSigner
);
```

**Learning Outcomes**:
- Why input proofs are necessary
- How encryption binding works
- Permission lifecycle management

---

#### 3. FHE Add (Arithmetic Operations)

**File**: `contracts/basic/FHEAdd.sol`

**Demonstrates**:
- Encrypted arithmetic operations
- Working with multiple encrypted inputs
- Result permission management

**Key Functions**:
```solidity
function add(
  externalEuint32 encryptedA,
  bytes calldata proofA,
  externalEuint32 encryptedB,
  bytes calldata proofB
) external
function getResult() external view returns (euint32)
```

**Available FHE Operations**:
- `FHE.add(a, b)` - Addition
- `FHE.sub(a, b)` - Subtraction
- `FHE.mul(a, b)` - Multiplication
- `FHE.div(a, b)` - Division
- `FHE.rem(a, b)` - Remainder
- `FHE.eq(a, b)` - Equality (returns ebool)
- `FHE.lt(a, b)` - Less than
- `FHE.gt(a, b)` - Greater than

**Usage Example**:
```typescript
// Create two encrypted inputs
const inputA = await fhevm
  .createEncryptedInput(contractAddress, userAddress)
  .add32(10)
  .encrypt();

const inputB = await fhevm
  .createEncryptedInput(contractAddress, userAddress)
  .add32(20)
  .encrypt();

// Perform encrypted addition
await contract.add(
  inputA.handles[0],
  inputA.inputProof,
  inputB.handles[0],
  inputB.inputProof
);

// Get result
const encryptedResult = await contract.getResult();
const decryptedResult = await fhevm.userDecryptEuint(
  FhevmType.euint32,
  encryptedResult,
  contractAddress,
  userSigner
);
// decryptedResult === 30
```

**Learning Outcomes**:
- How encrypted arithmetic works
- Operations without decryption
- Multiple input handling

---

#### 4. Access Control Example

**File**: `contracts/basic/AccessControlExample.sol`

**Demonstrates**:
- `FHE.allowThis()` pattern
- `FHE.allow()` for user permissions
- Permission delegation
- Per-user encrypted secrets

**Key Functions**:
```solidity
function storeSecret(externalEuint32 encryptedSecret, bytes calldata inputProof) external
function getOwnSecret() external view returns (euint32)
function delegateSecret(address recipient) external
```

**Usage Example**:
```typescript
// Store encrypted secret
const secret = 12345;
const encryptedInput = await fhevm
  .createEncryptedInput(contractAddress, aliceAddress)
  .add32(secret)
  .encrypt();

await contract.connect(alice).storeSecret(
  encryptedInput.handles[0],
  encryptedInput.inputProof
);

// Alice retrieves her secret
const aliceEncrypted = await contract.connect(alice).getOwnSecret();
const aliceDecrypted = await fhevm.userDecryptEuint(
  FhevmType.euint32,
  aliceEncrypted,
  contractAddress,
  alice
);

// Alice delegates to Bob
await contract.connect(alice).delegateSecret(bobAddress);

// Now Bob can also access
const bobEncrypted = await contract.connect(bob).getOwnSecret();
```

**Learning Outcomes**:
- When to use `FHE.allowThis()`
- When to use `FHE.allow()`
- Permission delegation patterns
- Common access control mistakes

---

### Advanced Examples

#### 5. Confidential Prediction Market

**File**: `contracts/PredictionMarket.sol`

**Demonstrates**:
- Complex real-world application
- Multiple encrypted types (`euint32`, `ebool`)
- Market lifecycle management
- Privacy-preserving betting
- Encrypted winnings calculation

**Key Functions**:
```solidity
function createMarket(string memory _question, uint256 _duration) external returns (uint256)
function placeBet(uint256 _marketId, bool _prediction) external payable
function resolveMarket(uint256 _marketId, bool _outcome) external
function claimWinnings(uint256 _marketId) external
function getMarket(uint256 _marketId) external view returns (...)
```

**Usage Example**:
```typescript
// Create market
const question = "Will Bitcoin reach $100k in 2025?";
const duration = 7 * 24 * 60 * 60; // 1 week
await market.createMarket(question, duration);

// Place encrypted bet
const betAmount = ethers.parseEther("0.1");
const prediction = true; // YES
await market.placeBet(0, prediction, { value: betAmount });

// After market ends, creator resolves
await market.connect(creator).resolveMarket(0, true);

// Winners claim
await market.claimWinnings(0);
```

**Privacy Features**:
- Bet amounts remain encrypted
- Predictions stay confidential
- Front-running prevention
- Fair outcome distribution

**Learning Outcomes**:
- Designing privacy-first applications
- Managing encrypted state at scale
- Complex permission patterns
- Security considerations

---

## Example Categories

### Generate Category Projects

Create standalone projects with multiple related examples:

```bash
# Basic examples (FHECounter, encryption, operations)
npm run create-category basic ../output/basic-examples

# Advanced examples (Prediction Market, complex patterns)
npm run create-category advanced ../output/advanced-examples
```

## Documentation Generation

### Auto-Generate Docs

```bash
# Generate docs for specific example
npm run generate-docs prediction-market

# Generate all documentation
npm run generate-all-docs
```

**Output**: GitBook-compatible markdown in `docs/` directory

## Testing Examples

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npx hardhat test test/PredictionMarket.ts
npx hardhat test test/basic/FHECounter.ts

# Run with coverage
npm run coverage
```

### Test Structure

All test files include:

- ✅ **Correct usage examples** - Demonstrates proper patterns
- ❌ **Anti-patterns** - Shows common mistakes
- 📚 **Educational comments** - Explains FHEVM concepts

### Example Test Pattern

```typescript
describe("Contract", function () {
  beforeEach(async function () {
    if (!fhevm.isMock) {
      this.skip(); // Skip on non-mock networks
    }
    // Setup...
  });

  /**
   * ✅ CORRECT: Proper pattern
   */
  it("should demonstrate correct usage", async function () {
    // Test implementation
  });

  /**
   * ❌ INCORRECT: What NOT to do
   */
  it("should explain common mistake", async function () {
    // Anti-pattern documentation
  });

  /**
   * 📚 EDUCATIONAL: Concept explanation
   */
  it("explains why pattern matters", async function () {
    // Educational test
  });
});
```

## Common Workflows

### Workflow 1: Explore Basic Examples

```bash
# 1. Generate basic examples project
npm run create-category basic ../learn-fhevm

# 2. Navigate to project
cd ../learn-fhevm

# 3. Install dependencies
npm install

# 4. Compile contracts
npm run compile

# 5. Run tests
npm test

# 6. Study contracts in contracts/
# 7. Study tests in test/
```

### Workflow 2: Create Standalone Example

```bash
# 1. Generate standalone example
npm run create-example prediction-market ../my-example

# 2. Navigate to project
cd ../my-example

# 3. Install and test
npm install
npm run compile
npm test

# 4. Deploy locally
npm run deploy:localhost

# 5. Deploy to testnet
npm run deploy:sepolia
```

### Workflow 3: Build New Example

```bash
# 1. Create contract in contracts/
# 2. Create test in test/
# 3. Update create-example.ts with new example config
# 4. Generate documentation
npm run generate-docs your-example

# 5. Test standalone generation
npm run create-example your-example ../test-output

# 6. Verify generated project works
cd ../test-output
npm install && npm test
```

## FHEVM Concepts Reference

### Encrypted Types

```solidity
euint8, euint16, euint32, euint64, euint128, euint256
ebool
eaddress
```

### Access Control

```solidity
// Contract access
FHE.allowThis(encryptedValue);

// User access
FHE.allow(encryptedValue, userAddress);

// Temporary access (gas efficient)
FHE.allowTransient(encryptedValue, userAddress);
```

### Input Encryption

```solidity
// With proof verification
function operation(externalEuint32 input, bytes calldata proof) external {
  euint32 value = FHE.fromExternal(input, proof);
}

// Direct encryption (for constants)
euint32 value = FHE.asEuint32(42);
```

### Arithmetic Operations

```solidity
euint32 sum = FHE.add(a, b);
euint32 diff = FHE.sub(a, b);
euint32 product = FHE.mul(a, b);
euint32 quotient = FHE.div(a, b);
```

### Comparison Operations

```solidity
ebool isEqual = FHE.eq(a, b);
ebool isLess = FHE.lt(a, b);
ebool isGreater = FHE.gt(a, b);
```

### Conditional Operations

```solidity
// Encrypted if-then-else
euint32 result = FHE.select(condition, valueIfTrue, valueIfFalse);
```

## Troubleshooting

### Common Issues

**Issue**: Tests fail with "User not authorized"
**Solution**: Ensure both `FHE.allowThis()` and `FHE.allow()` are called

**Issue**: Input proof verification fails
**Solution**: Create new encrypted input for each operation (proofs are single-use)

**Issue**: Cannot decrypt values in tests
**Solution**: Use `fhevm.userDecryptEuint()` with proper parameters

**Issue**: TypeScript compilation errors
**Solution**: Run `npm run compile` to generate typechain types

**Issue**: Tests skip automatically
**Solution**: Tests check `fhevm.isMock` and only run in mock mode

## Resources

### Documentation
- [FHEVM Official Docs](https://docs.zama.ai/fhevm)
- [FHE Types Reference](https://docs.zama.ai/fhevm/fundamentals/types)
- [Access Control Guide](https://docs.zama.ai/fhevm/fundamentals/acl)

### Example Projects
- [FHEVM Hardhat Template](https://github.com/zama-ai/fhevm-hardhat-template)
- [FHEVM dApps](https://github.com/zama-ai/dapps)

### Community
- [Zama Community Forum](https://www.zama.ai/community)
- [Discord Server](https://discord.com/invite/zama)
- [Twitter](https://twitter.com/zama)

## Contributing

### Adding New Examples

1. Create contract in appropriate directory
2. Write comprehensive tests
3. Update automation scripts
4. Generate documentation
5. Test standalone generation
6. Submit PR with description

### Improving Examples

- Add more test cases
- Enhance documentation
- Fix bugs
- Optimize gas usage
- Add anti-pattern examples

## License

MIT License - Free for educational and commercial use

---

**Maintained for Zama FHEVM Bounty Program December 2025**

This guide covers all examples and patterns needed to master FHEVM development.
