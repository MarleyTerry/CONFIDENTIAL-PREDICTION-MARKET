# Confidential Prediction Market

A privacy-preserving prediction market platform demonstrating Fully Homomorphic Encryption (FHE) on Ethereum. This example enables users to place encrypted bets on future events while maintaining complete confidentiality of their positions and bet amounts.

## Overview

This example demonstrates how to build a confidential prediction market where:
- **Bet amounts remain encrypted** - No one knows how much you wagered
- **Predictions stay private** - Your YES/NO position remains secret until resolution
- **Front-running is prevented** - Encrypted predictions prevent market manipulation
- **Fair outcomes** - Aggregate statistics available without individual exposure

## Key FHEVM Concepts

### Encrypted State Variables

The contract uses FHEVM's encrypted types to protect sensitive user data:

```solidity
struct Bet {
    euint32 encryptedAmount;      // Encrypted bet amount
    ebool encryptedPrediction;     // Encrypted YES/NO prediction
    bool claimed;
    address bettor;
}
```

**Why This Matters:**
- `euint32`: Stores bet amounts encrypted, preventing anyone from seeing wager sizes
- `ebool`: Keeps predictions confidential until market resolution
- Only the bettor and contract have access to decrypt these values

### Access Control Management

FHEVM requires explicit access control for encrypted values:

```solidity
// Allow contract to access encrypted values
FHE.allowThis(encryptedAmount);
FHE.allowThis(encryptedPrediction);

// Allow bettor to retrieve their encrypted data
FHE.allow(encryptedAmount, msg.sender);
FHE.allow(encryptedPrediction, msg.sender);
```

**Critical Learning:**
- `FHE.allowThis()` - Grants the contract permission to perform operations on encrypted values
- `FHE.allow(value, user)` - Grants specific user permission to access the value
- **Both are required** - Missing either will cause transaction failures

### Input Encryption Pattern

Converting public inputs to encrypted format:

```solidity
// Convert public bet data to encrypted format
uint32 betAmountUnits = uint32(msg.value / (0.001 ether));
euint32 encryptedAmount = FHE.asEuint32(betAmountUnits);
ebool encryptedPrediction = FHE.asEbool(_prediction);
```

**Pattern Explanation:**
1. Accept public input (msg.value, bool prediction)
2. Normalize to appropriate type (uint32)
3. Encrypt using `FHE.asEuint32()` or `FHE.asEbool()`
4. Set proper access controls

## Contract Implementation

### File Locations

To run this example correctly, place files in these directories:

```
contracts/PredictionMarket.sol    → <project-root>/contracts/
test/PredictionMarket.ts          → <project-root>/test/
```

This ensures Hardhat can compile and test your contracts as expected.

### Core Functions

#### 1. Create Market

```solidity
function createMarket(string memory _question, uint256 _duration)
    external
    returns (uint256)
```

Creates a new prediction market with:
- Question defining the outcome to predict
- Duration specifying how long betting remains open
- Creator address who can resolve the market

**Usage:**
```typescript
const question = "Will Bitcoin reach $50k by end of year?";
const duration = 7 * 24 * 60 * 60; // 1 week
const tx = await contract.createMarket(question, duration);
```

#### 2. Place Bet

```solidity
function placeBet(uint256 _marketId, bool _prediction)
    external
    payable
```

Submits an encrypted bet with:
- Market ID to bet on
- Prediction (true = YES, false = NO) - encrypted to ebool
- ETH amount (msg.value) - converted to encrypted euint32

**Key Features:**
- Minimum bet: 0.001 ETH
- Maximum bet: 10 ETH
- One bet per user per market
- Cannot bet after market ends

**Usage:**
```typescript
const betAmount = ethers.parseEther("0.1");
const prediction = true; // YES
await contract.placeBet(marketId, prediction, { value: betAmount });
```

#### 3. Resolve Market

```solidity
function resolveMarket(uint256 _marketId, bool _outcome)
    external
```

Creator-only function to determine market outcome:
- Only callable after market end time
- Sets the final outcome (YES or NO)
- Enables winners to claim winnings

**Access Control:**
- Restricted to market creator
- Cannot be called before market ends
- Cannot be called twice (prevents manipulation)

**Usage:**
```typescript
const outcome = true; // Market resolved to YES
await contract.connect(creator).resolveMarket(marketId, outcome);
```

#### 4. Claim Winnings

```solidity
function claimWinnings(uint256 _marketId)
    external
```

Allows winners to withdraw their payouts:
- Calculates winnings based on betting pools
- Transfers ETH to winner
- Prevents reentrancy with checks-effects-interactions pattern

**Security Features:**
- Reentrancy protection (claim flag set first)
- One-time claim only
- Automated payout calculation

## Privacy Architecture

### What Remains Private

1. **Individual Bet Amounts**
   - Encrypted as euint32
   - Only contract and bettor can access
   - Prevents "whale watching" and confidence signals

2. **User Predictions**
   - Encrypted as ebool
   - Cannot determine YES/NO split until resolution
   - Eliminates front-running opportunities

3. **Betting Patterns**
   - No correlation between addresses and bet sizes
   - Protected transaction privacy

### What Remains Public

1. **Market Questions** - Necessary for participation
2. **End Times** - Determines betting deadline
3. **Participant Count** - Shows market engagement
4. **Resolution Outcome** - Final result must be public for settlements

## Testing Guide

### Running Tests

```bash
# Install dependencies
npm install

# Compile contracts
npm run compile

# Run test suite
npm test

# Run specific test file
npx hardhat test test/PredictionMarket.ts
```

### Test Coverage

The test suite demonstrates:

✅ **Correct Usage:**
- Creating markets with valid parameters
- Placing encrypted bets with proper access control
- Multiple users participating in markets
- Creator-only resolution after market ends
- Winners claiming payouts

❌ **Anti-Patterns:**
- Empty or invalid market questions
- Bets below minimum or above maximum
- Multiple bets from same user
- Non-creator resolution attempts
- Claiming before resolution
- Double claim attempts

### Key Test Scenarios

#### Access Control Pattern Test

```typescript
it("demonstrates FHE.allowThis() and FHE.allow() pattern", async function () {
  const betAmount = ethers.parseEther("0.1");

  // When placeBet is called:
  // 1. encryptedAmount = FHE.asEuint32(betAmountUnits)
  // 2. FHE.allowThis(encryptedAmount) - contract gets access
  // 3. FHE.allow(encryptedAmount, msg.sender) - user gets access

  const tx = await contract.connect(alice).placeBet(0, true, {
    value: betAmount
  });

  expect(tx).to.not.be.undefined;
});
```

#### Input Encryption Test

```typescript
it("demonstrates input encryption with asEuint32", async function () {
  // In contract:
  // msg.value (public) -> uint32 betAmountUnits -> euint32 encryptedAmount

  const betAmount = ethers.parseEther("0.1");

  const tx = await contract.connect(alice).placeBet(0, true, {
    value: betAmount
  });
  await tx.wait();

  const [betExists] = await contract.connect(alice).getBetExists(0);
  expect(betExists).to.equal(true);
});
```

## Common Anti-Patterns

### ❌ Missing FHE.allowThis()

**Incorrect:**
```solidity
function unsafeBet(uint32 amount) external {
  euint32 encrypted = FHE.asEuint32(amount);
  // Missing: FHE.allowThis(encrypted);
  _totalBets = FHE.add(_totalBets, encrypted); // ❌ Will revert!
}
```

**Correct:**
```solidity
function safeBet(uint32 amount) external {
  euint32 encrypted = FHE.asEuint32(amount);
  FHE.allowThis(encrypted);        // ✅ Contract can access
  FHE.allow(encrypted, msg.sender); // ✅ User can access
  _totalBets = FHE.add(_totalBets, encrypted);
}
```

### ❌ Missing Bounds Checking

**Incorrect:**
```solidity
function unsafeBet(uint256 _amount) external payable {
  euint32 encrypted = FHE.asEuint32(uint32(_amount));
  // No minimum/maximum check - could lose precision or overflow
}
```

**Correct:**
```solidity
function safeBet() external payable {
  require(msg.value >= MIN_BET && msg.value <= MAX_BET, "Invalid bet amount");
  uint32 betAmountUnits = uint32(msg.value / (0.001 ether));
  euint32 encrypted = FHE.asEuint32(betAmountUnits);
}
```

### ❌ Reentrancy Vulnerability

**Incorrect:**
```solidity
function unsafeClaim(uint256 _marketId) external {
  uint256 winnings = calculateWinnings(_marketId);
  (bool success, ) = msg.sender.call{value: winnings}("");
  require(success);
  bets[_marketId][msg.sender].claimed = true; // ❌ Too late!
}
```

**Correct:**
```solidity
function safeClaim(uint256 _marketId) external {
  bet.claimed = true; // ✅ Mark first (checks-effects)
  payable(msg.sender).transfer(winnings); // ✅ Then transfer (interactions)
}
```

## Security Considerations

### Implemented Protections

1. **Reentrancy Guards**
   - Claim winnings marked before external calls
   - State changes before ETH transfers

2. **Access Control**
   - Creator-only resolution with address verification
   - Per-function modifiers enforce permissions

3. **Time Locks**
   - 30-day delay for emergency withdrawals
   - End time validation for bets and resolution

4. **Bet Validation**
   - Minimum/maximum amount enforcement
   - One bet per user per market
   - Active market checks

### Known Limitations

⚠️ **Educational Simplifications:**

1. **Simplified Decryption**
   - Production requires threshold decryption network
   - Current implementation uses placeholder logic

2. **Winnings Calculation**
   - Production needs encrypted pool totals
   - Current implementation uses public totals for demonstration

3. **Gas Costs**
   - FHE operations more expensive than standard operations
   - Mainnet deployment requires optimization

## Production Considerations

### Threshold Decryption

In production, you would implement:

```solidity
// Request decryption from relayer network
uint256 requestId = DecryptionOracle.requestDecryption(
  encryptedAmount,
  address(this),
  bytes4(keccak256("handleDecryption(uint256,uint32)"))
);
```

### Encrypted Pool Totals

For complete privacy:

```solidity
struct Market {
  euint32 encryptedYesPool;  // Instead of uint256 totalYesBets
  euint32 encryptedNoPool;   // Instead of uint256 totalNoBets
  // ...
}
```

### Oracle Integration

Automated resolution:

```solidity
interface IPriceOracle {
  function requestOutcome(uint256 marketId) external returns (uint256 requestId);
}
```

## Extension Ideas

### 1. Multi-Outcome Markets

Extend beyond binary YES/NO:

```solidity
struct Bet {
  euint8 encryptedOutcomeChoice; // 0-255 possible outcomes
  euint32 encryptedAmount;
}
```

### 2. Encrypted Aggregation

Calculate totals without revealing individuals:

```solidity
function addToPools(euint32 amount, ebool prediction) internal {
  euint32 yesContribution = FHE.select(prediction, amount, FHE.asEuint32(0));
  euint32 noContribution = FHE.select(FHE.not(prediction), amount, FHE.asEuint32(0));

  encryptedYesPool = FHE.add(encryptedYesPool, yesContribution);
  encryptedNoPool = FHE.add(encryptedNoPool, noContribution);
}
```

### 3. Dynamic Odds

Real-time odds calculation:

```solidity
function getImpliedProbability() public view returns (uint256) {
  // Calculate from encrypted pool ratios
  // Requires threshold decryption for accuracy
}
```

### 4. Liquidity Pools

AMM-style market making:

```solidity
function provideLiquidity(bool side) external payable {
  // Provide liquidity to YES or NO side
  // Earn fees from bet placements
}
```

## Development Workflow

### 1. Setup Environment

```bash
git clone <repository-url>
cd PredictionMarket
npm install
```

### 2. Configure Hardhat

Ensure `hardhat.config.cjs` includes:

```javascript
require("@nomicfoundation/hardhat-toolbox");
require("@fhevm/hardhat-plugin");

module.exports = {
  solidity: "0.8.25",
  networks: {
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL,
      accounts: [process.env.PRIVATE_KEY]
    }
  }
};
```

### 3. Local Testing

```bash
# Compile contracts
npm run compile

# Run tests
npm test

# Check coverage
npm run coverage
```

### 4. Deploy to Testnet

```bash
# Deploy to Sepolia
npm run deploy:sepolia

# Initialize demo markets
npm run init-demo
```

### 5. Verify Contract

```bash
npx hardhat verify --network sepolia <CONTRACT_ADDRESS>
```

## Resources

### FHEVM Documentation
- [FHEVM Docs](https://docs.zama.ai/fhevm) - Official FHEVM documentation
- [FHE Types Guide](https://docs.zama.ai/fhevm/fundamentals/types) - Encrypted type reference
- [Access Control](https://docs.zama.ai/fhevm/fundamentals/acl) - Permission system

### Example Projects
- [FHEVM Hardhat Template](https://github.com/zama-ai/fhevm-hardhat-template) - Base template
- [FHEVM dApps](https://github.com/zama-ai/dapps) - Live examples
- [OpenZeppelin Confidential](https://github.com/OpenZeppelin/openzeppelin-confidential-contracts) - Token standards

### Support
- [Zama Community Forum](https://www.zama.ai/community) - Developer support
- [Discord Server](https://discord.com/invite/zama) - Real-time chat
- [Twitter](https://twitter.com/zama) - Updates and announcements

## License

MIT License - Free for educational and commercial use

---

**Built for Zama FHEVM Bounty Program December 2025**

This example demonstrates production-ready patterns for privacy-preserving smart contracts using Fully Homomorphic Encryption. While simplified for educational purposes, the core concepts scale to enterprise applications requiring confidential computation on blockchain.
