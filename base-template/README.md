# FHEVM Example - Base Template

This is the base Hardhat template for FHEVM (Fully Homomorphic Encryption Virtual Machine) smart contract development.

## Quick Start

### Installation

```bash
npm install
```

### Compilation

```bash
npm run compile
```

### Testing

```bash
npm run test
```

### Deployment

```bash
# Local deployment
npm run deploy:localhost

# Sepolia testnet
npm run deploy:sepolia
```

## Project Structure

```
.
├── contracts/          # Solidity smart contracts
├── test/              # Test files
├── scripts/           # Deployment and utility scripts
├── hardhat.config.ts  # Hardhat configuration
├── package.json       # Dependencies
└── tsconfig.json      # TypeScript configuration
```

## Environment Setup

1. Copy `.env.example` to `.env`
2. Fill in your configuration:
   - `SEPOLIA_RPC_URL` - Your Infura/Alchemy RPC URL
   - `PRIVATE_KEY` - Your deployer private key
   - `ETHERSCAN_API_KEY` - For contract verification

## FHEVM Basics

This template is configured for FHEVM development with:

- **@fhevm/solidity** - Core FHEVM library
- **@fhevm/hardhat-plugin** - Hardhat integration for testing
- **Hardhat** - Development environment
- **TypeScript** - Type-safe development

## Key FHEVM Patterns

### Encrypted Types

```solidity
import "@fhevm/solidity/lib/FHE.sol";

euint32 encryptedValue;  // 32-bit encrypted integer
ebool encryptedBool;     // Encrypted boolean
```

### Access Control

```solidity
FHE.allowThis(encryptedValue);        // Contract access
FHE.allow(encryptedValue, msg.sender); // User access
```

### Input Encryption

```solidity
euint32 encrypted = FHE.asEuint32(publicValue);
```

## Resources

- [FHEVM Documentation](https://docs.zama.ai/fhevm)
- [Hardhat Documentation](https://hardhat.org)
- [Solidity Documentation](https://docs.soliditylang.org)

## License

MIT License
