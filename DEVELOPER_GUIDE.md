# Developer Guide

This guide provides comprehensive instructions for developers working on this FHEVM prediction market example and for those who want to extend it or create new examples.

## Table of Contents

- [Project Overview](#project-overview)
- [Architecture](#architecture)
- [Development Setup](#development-setup)
- [Creating New Examples](#creating-new-examples)
- [Testing Strategy](#testing-strategy)
- [Deployment Guide](#deployment-guide)
- [Maintenance and Updates](#maintenance-and-updates)
- [Troubleshooting](#troubleshooting)

## Project Overview

This project demonstrates a confidential prediction market built with FHEVM (Fully Homomorphic Encryption Virtual Machine). It serves as both a functional application and an educational resource for learning FHEVM development patterns.

### Key Features

- **Privacy-Preserving Betting**: Bet amounts and predictions remain encrypted
- **Access Control**: Proper FHE permission management
- **Market Lifecycle**: Creation, betting, resolution, and claim phases
- **Automated Tools**: Scripts for scaffolding and documentation generation
- **Comprehensive Tests**: Examples of correct usage and anti-patterns

### Technology Stack

- **Solidity 0.8.25**: Smart contract language
- **FHEVM/Solidity**: Fully homomorphic encryption library
- **Hardhat**: Development environment
- **TypeScript**: Testing and automation
- **Ethers.js v6**: Blockchain interaction

## Architecture

### Directory Structure

```
PredictionMarket/
├── contracts/
│   └── PredictionMarket.sol      # Main smart contract
├── test/
│   └── PredictionMarket.ts       # Comprehensive test suite
├── scripts/
│   ├── deploy.ts                 # Deployment script
│   ├── initialize-demo.ts        # Demo initialization
│   ├── create-example.ts         # Repository generator
│   ├── generate-docs.ts          # Documentation generator
│   └── README.md                 # Scripts documentation
├── docs/
│   ├── SUMMARY.md                # GitBook navigation
│   └── prediction-market.md      # Generated documentation
├── hardhat.config.cjs            # Hardhat configuration
├── package.json                  # Dependencies and scripts
├── tsconfig.json                 # TypeScript configuration
├── README.md                     # Project README
└── DEVELOPER_GUIDE.md            # This file
```

### Contract Architecture

```
PredictionMarket
├── Structs
│   ├── Market                    # Market metadata
│   └── Bet                       # Encrypted bet data
├── State Variables
│   ├── markets (mapping)         # All markets
│   ├── bets (nested mapping)     # User bets per market
│   └── marketBettors (mapping)   # Bettor addresses
└── Functions
    ├── createMarket()            # Create prediction market
    ├── placeBet()                # Submit encrypted bet
    ├── resolveMarket()           # Determine outcome
    ├── claimWinnings()           # Distribute payouts
    └── View functions            # Read market state
```

### Test Architecture

```
Test Suite
├── Market Creation
│   ├── Valid creation
│   ├── Invalid parameters
│   └── Multiple creators
├── Encrypted Bet Placement
│   ├── Access control patterns
│   ├── Amount validation
│   └── Duplicate prevention
├── Market Resolution
│   ├── Creator-only access
│   ├── Time validation
│   └── Double resolution prevention
├── Winnings Claims
│   ├── Winner verification
│   └── Reentrancy protection
└── Educational Examples
    ├── FHE.allowThis() pattern
    ├── Input encryption
    └── Common anti-patterns
```

## Development Setup

### Prerequisites

```bash
# Required software
Node.js 18+
npm or yarn
Git

# Optional but recommended
VS Code with Solidity extension
Hardhat extension for VS Code
```

### Installation

```bash
# Clone repository
git clone <repository-url>
cd PredictionMarket

# Install dependencies
npm install

# Compile contracts
npm run compile
```

### Environment Configuration

Create `.env` file:

```bash
# Network RPC URLs
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID

# Private keys (NEVER commit these!)
PRIVATE_KEY=0x...

# Optional: Etherscan verification
ETHERSCAN_API_KEY=YOUR_API_KEY
```

### Running Tests

```bash
# Run all tests
npm run test

# Run specific test file
npx hardhat test test/PredictionMarket.ts

# Run with coverage
npm run coverage

# Run with gas reporting
REPORT_GAS=true npm run test
```

## Creating New Examples

### Step 1: Write the Contract

Create `contracts/YourExample.sol`:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "@fhevm/solidity/lib/FHE.sol";

/// @title YourExample
/// @notice Brief description of what this example demonstrates
contract YourExample {
    // Encrypted state variable
    euint32 private _value;

    /// @notice Sets encrypted value
    /// @dev Demonstrates FHE.allowThis() and FHE.allow() pattern
    function setValue(uint32 _newValue) external {
        euint32 encrypted = FHE.asEuint32(_newValue);

        // CRITICAL: Set access permissions
        FHE.allowThis(encrypted);        // Contract access
        FHE.allow(encrypted, msg.sender); // User access

        _value = encrypted;
    }

    /// @notice Gets encrypted value handle
    function getValue() external view returns (euint32) {
        return _value;
    }
}
```

**Key Points:**
- Include detailed comments
- Demonstrate FHE patterns clearly
- Show both correct usage and potential pitfalls
- Use `euint32`, `ebool`, etc. for encrypted data

### Step 2: Write Comprehensive Tests

Create `test/YourExample.ts`:

```typescript
import { ethers, fhevm } from "hardhat";
import { expect } from "chai";

describe("YourExample", function () {
  let contract: any;
  let contractAddress: string;
  let alice: any;

  beforeEach(async function () {
    if (!fhevm.isMock) {
      this.skip();
    }

    const [owner, signer] = await ethers.getSigners();
    alice = signer;

    const factory = await ethers.getContractFactory("YourExample");
    contract = await factory.deploy();
    contractAddress = await contract.getAddress();
  });

  /**
   * ✅ CORRECT: Demonstrates proper FHE pattern
   */
  it("should set value with correct access control", async function () {
    const value = 42;

    const tx = await contract.setValue(value);
    await tx.wait();

    const encryptedValue = await contract.getValue();
    expect(encryptedValue).to.not.equal(ethers.ZeroHash);
  });

  /**
   * ❌ INCORRECT: Documents common mistake
   */
  it("explains importance of FHE.allowThis()", async function () {
    // This test documents the pattern
    // In practice, missing FHE.allowThis() would cause revert
    expect(true).to.equal(true);
  });
});
```

**Key Points:**
- Use ✅ for correct patterns
- Use ❌ for anti-patterns
- Include explanatory comments
- Test both success and failure cases

### Step 3: Update Automation Scripts

#### Update create-example.ts

Add to `EXAMPLES_MAP`:

```typescript
"your-example": {
  name: "your-example",
  title: "Your Example Title",
  description: "Brief description of what this demonstrates",
  contractFile: "contracts/YourExample.sol",
  testFile: "test/YourExample.ts",
  category: "basic",  // or "advanced"
  tags: ["encryption", "access-control", "your-tags"],
}
```

#### Update generate-docs.ts

Add to `EXAMPLES_CONFIG`:

```typescript
"your-example": {
  name: "your-example",
  title: "Your Example Title",
  description: "Brief description",
  sections: [],
  category: "basic",
  tags: ["encryption", "access-control"],
}
```

### Step 4: Generate Documentation

```bash
# Generate docs for your example
ts-node scripts/generate-docs.ts your-example

# Verify output
cat docs/your-example.md
cat docs/SUMMARY.md
```

### Step 5: Test Standalone Repository

```bash
# Generate standalone repository
ts-node scripts/create-example.ts your-example ../test-output/your-example

# Navigate and test
cd ../test-output/your-example
npm install
npm run compile
npm run test
```

### Step 6: Submit and Document

1. Commit your changes
2. Update main README if needed
3. Add to examples list
4. Create PR with description

## Testing Strategy

### Test Categories

1. **Unit Tests**
   - Individual function behavior
   - Parameter validation
   - State changes

2. **Integration Tests**
   - Multi-step workflows
   - Contract interactions
   - Access control verification

3. **Educational Tests**
   - Correct usage patterns
   - Common anti-patterns
   - FHE concept demonstrations

### Writing Effective Tests

```typescript
describe("Feature", function () {
  /**
   * ✅ CORRECT: Clear description of what's being tested
   *
   * Explanation: Why this pattern is correct
   */
  it("should demonstrate correct pattern", async function () {
    // Arrange: Setup test data
    const value = 42;

    // Act: Execute the operation
    const tx = await contract.operation(value);
    await tx.wait();

    // Assert: Verify results
    expect(result).to.equal(expectedValue);
  });

  /**
   * ❌ INCORRECT: What NOT to do
   *
   * Explanation: Why this fails and how to avoid it
   */
  it("should reject incorrect pattern", async function () {
    await expect(
      contract.badOperation()
    ).to.be.revertedWith("Error message");
  });
});
```

### Test Coverage Goals

- **Functions**: 100% of public/external functions
- **Branches**: All conditional paths
- **Edge Cases**: Boundary conditions
- **Anti-Patterns**: Common mistakes documented

## Deployment Guide

### Local Deployment

```bash
# Start local Hardhat node
npx hardhat node

# In another terminal, deploy
npm run deploy:localhost
```

### Testnet Deployment (Sepolia)

```bash
# Set environment variables
export SEPOLIA_RPC_URL="https://..."
export PRIVATE_KEY="0x..."

# Deploy
npm run deploy:sepolia

# Verify on Etherscan
npx hardhat verify --network sepolia <CONTRACT_ADDRESS>
```

### Deployment Checklist

- [ ] Environment variables configured
- [ ] Sufficient ETH for gas
- [ ] Contract compiled successfully
- [ ] Tests passing
- [ ] Deployment script tested
- [ ] Verification prepared

### Post-Deployment

1. **Save Contract Address**
   - Record in deployment.json
   - Update frontend configuration
   - Document in README

2. **Verify Contract**
   - Run Etherscan verification
   - Check contract is verified
   - Test on block explorer

3. **Initialize Demo (if applicable)**
   ```bash
   npm run init-demo
   ```

4. **Test Live Contract**
   - Run smoke tests
   - Verify basic functionality
   - Check access controls

## Maintenance and Updates

### Updating Dependencies

When `@fhevm/solidity` releases a new version:

#### Step 1: Update package.json

```bash
npm install @fhevm/solidity@latest
npm install @fhevm/hardhat-plugin@latest
```

#### Step 2: Test Compilation

```bash
npm run compile
```

Fix any breaking changes in contracts.

#### Step 3: Run Tests

```bash
npm run test
```

Fix any failing tests due to API changes.

#### Step 4: Update Documentation

```bash
# Regenerate docs
ts-node scripts/generate-docs.ts --all

# Review changes
git diff docs/
```

#### Step 5: Update Examples

```bash
# Test example generation
ts-node scripts/create-example.ts prediction-market ../test-output

# Verify generated repo works
cd ../test-output/prediction-market
npm install && npm test
```

### Version Control Best Practices

```bash
# Create feature branch
git checkout -b feature/your-feature

# Make changes with clear commits
git commit -m "feat: add new example for X"

# Push and create PR
git push origin feature/your-feature
```

### Commit Message Format

```
<type>(<scope>): <subject>

Types: feat, fix, docs, test, refactor, chore
Scopes: contract, test, scripts, docs
```

Examples:
```
feat(contract): add multi-outcome market support
fix(test): correct access control test assertion
docs(readme): update deployment instructions
test(integration): add resolution workflow tests
```

## Troubleshooting

### Common Issues

#### Compilation Errors

**Problem:** `Cannot find module '@fhevm/solidity'`
```bash
# Solution
npm install @fhevm/solidity
```

**Problem:** `Solidity version mismatch`
```bash
# Solution: Check hardhat.config
solidity: "0.8.25"  // Must match contract pragma
```

#### Test Failures

**Problem:** `User is not authorized to access encrypted value`
```solidity
// Solution: Add access control
FHE.allowThis(encryptedValue);
FHE.allow(encryptedValue, msg.sender);
```

**Problem:** `Tests skip on mock check`
```typescript
// Solution: Ensure fhevm.isMock is true
if (!fhevm.isMock) {
  this.skip();  // This is correct for FHEVM mocks
}
```

#### Deployment Issues

**Problem:** `Insufficient funds for gas`
```bash
# Solution: Get testnet ETH
Visit https://sepoliafaucet.com
```

**Problem:** `Nonce too low`
```bash
# Solution: Reset account nonce in MetaMask
Settings > Advanced > Reset Account
```

### Getting Help

- **FHEVM Docs**: https://docs.zama.ai/fhevm
- **Community Forum**: https://www.zama.ai/community
- **Discord**: https://discord.com/invite/zama
- **GitHub Issues**: https://github.com/zama-ai/fhevm/issues

## Best Practices

### Security

1. **Access Control**: Always use FHE.allowThis() and FHE.allow()
2. **Bounds Checking**: Validate all numeric inputs
3. **Reentrancy**: Use checks-effects-interactions pattern
4. **Time Locks**: Implement delays for critical operations

### Code Quality

1. **Comments**: Explain why, not just what
2. **Naming**: Use descriptive variable names
3. **Modularity**: Keep functions focused and small
4. **Testing**: Write tests before or alongside code

### Documentation

1. **README**: Keep updated with examples
2. **Inline Comments**: Explain complex logic
3. **CHANGELOG**: Document version changes
4. **Migration Guides**: Help users update

## Contributing

We welcome contributions! Please:

1. Follow existing code style
2. Write comprehensive tests
3. Update documentation
4. Submit PR with clear description

## Resources

### FHEVM Learning

- [FHEVM Documentation](https://docs.zama.ai/fhevm)
- [FHE Types Guide](https://docs.zama.ai/fhevm/fundamentals/types)
- [Access Control](https://docs.zama.ai/fhevm/fundamentals/acl)

### Development Tools

- [Hardhat Documentation](https://hardhat.org)
- [Ethers.js Documentation](https://docs.ethers.org/v6/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

### Community

- [Zama Community Forum](https://www.zama.ai/community)
- [Discord Server](https://discord.com/invite/zama)
- [Twitter](https://twitter.com/zama)

## License

MIT License - See LICENSE file

---

**Built for Zama FHEVM Bounty Program December 2025**

This guide is actively maintained. For updates or corrections, please submit an issue or PR.
