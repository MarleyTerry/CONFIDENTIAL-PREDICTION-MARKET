#!/usr/bin/env ts-node

/**
 * Automation Script: Create Standalone Example Repository
 *
 * This script generates complete standalone FHEVM example repositories
 * from contracts and tests in the source project.
 *
 * Usage:
 *   ts-node scripts/create-example.ts <example-name> <output-path>
 *   ts-node scripts/create-example.ts prediction-market ../my-examples/prediction-market
 *
 * Available Examples:
 *   - prediction-market (default)
 */

import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";

interface ExampleConfig {
  name: string;
  title: string;
  description: string;
  contractFile: string;
  testFile: string;
  category: string;
  tags: string[];
}

const EXAMPLES_MAP: Record<string, ExampleConfig> = {
  "prediction-market": {
    name: "prediction-market",
    title: "Confidential Prediction Market",
    description: "Privacy-preserving prediction market using FHEVM encrypted betting",
    contractFile: "contracts/PredictionMarket.sol",
    testFile: "test/PredictionMarket.ts",
    category: "advanced",
    tags: ["privacy", "market", "access-control", "encryption"],
  },
};

async function createExample(exampleName: string, outputPath: string) {
  const config = EXAMPLES_MAP[exampleName];

  if (!config) {
    console.error(
      `❌ Example "${exampleName}" not found. Available examples:`,
      Object.keys(EXAMPLES_MAP)
    );
    process.exit(1);
  }

  console.log(`📦 Creating "${config.title}" example...`);
  console.log(`📁 Output directory: ${outputPath}\n`);

  try {
    // Step 1: Create output directory
    if (fs.existsSync(outputPath)) {
      console.log(`⚠️  Directory already exists, removing...`);
      fs.rmSync(outputPath, { recursive: true, force: true });
    }
    fs.mkdirSync(outputPath, { recursive: true });
    console.log(`✅ Created output directory\n`);

    // Step 2: Copy base template from fhevm-hardhat-template
    const baseTemplatePath = path.join(
      __dirname,
      "..",
      "fhevm-hardhat-template"
    );
    if (!fs.existsSync(baseTemplatePath)) {
      console.log(
        "ℹ️  Note: Base template not found locally. Using minimal template structure.\n"
      );
      createMinimalTemplate(outputPath);
    } else {
      copyTemplate(baseTemplatePath, outputPath);
      console.log(`✅ Copied base template\n`);
    }

    // Step 3: Copy contract and test files
    const contractSource = path.join(__dirname, "..", config.contractFile);
    const testSource = path.join(__dirname, "..", config.testFile);

    const contractDest = path.join(outputPath, "contracts", "Example.sol");
    const testDest = path.join(outputPath, "test", "Example.ts");

    if (fs.existsSync(contractSource)) {
      fs.mkdirSync(path.dirname(contractDest), { recursive: true });
      fs.copyFileSync(contractSource, contractDest);
      console.log(`✅ Copied contract: ${path.relative(outputPath, contractDest)}`);
    }

    if (fs.existsSync(testSource)) {
      fs.mkdirSync(path.dirname(testDest), { recursive: true });
      fs.copyFileSync(testSource, testDest);
      console.log(`✅ Copied test: ${path.relative(outputPath, testDest)}`);
    }
    console.log();

    // Step 4: Generate README
    generateReadme(outputPath, config);
    console.log(`✅ Generated README.md\n`);

    // Step 5: Update package.json
    updatePackageJson(outputPath, config);
    console.log(`✅ Updated package.json\n`);

    // Step 6: Generate .gitignore
    generateGitignore(outputPath);
    console.log(`✅ Generated .gitignore\n`);

    // Step 7: Create scripts directory
    createScripts(outputPath, config);
    console.log(`✅ Generated deployment scripts\n`);

    console.log("✨ Example repository created successfully!\n");
    console.log("📝 Next steps:");
    console.log(`   cd ${outputPath}`);
    console.log("   npm install");
    console.log("   npm run compile");
    console.log("   npm run test");
  } catch (error) {
    console.error("❌ Error creating example:", error);
    process.exit(1);
  }
}

function createMinimalTemplate(outputPath: string) {
  const dirs = [
    "contracts",
    "test",
    "scripts",
    "artifacts",
    "cache",
    "node_modules",
  ];

  for (const dir of dirs) {
    fs.mkdirSync(path.join(outputPath, dir), { recursive: true });
  }

  // Create minimal hardhat.config.ts
  const hardhatConfig = `import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@fhevm/hardhat-plugin";
import "dotenv/config";

const config: HardhatUserConfig = {
  solidity: "0.8.25",
  networks: {
    hardhat: {},
    localhost: {
      url: "http://127.0.0.1:8545",
    },
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || "",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
  },
};

export default config;
`;

  fs.writeFileSync(path.join(outputPath, "hardhat.config.ts"), hardhatConfig);

  // Create minimal tsconfig.json
  const tsconfig = {
    compilerOptions: {
      target: "ES2020",
      module: "commonjs",
      lib: ["ES2020"],
      outDir: "./dist",
      rootDir: "./",
      strict: true,
      esModuleInterop: true,
      skipLibCheck: true,
      forceConsistentCasingInFileNames: true,
      resolveJsonModule: true,
      declaration: true,
      declarationMap: true,
      sourceMap: true,
    },
    include: ["**/*.ts"],
    exclude: ["node_modules", "dist", "artifacts", "cache"],
  };

  fs.writeFileSync(path.join(outputPath, "tsconfig.json"), JSON.stringify(tsconfig, null, 2));
}

function copyTemplate(source: string, destination: string) {
  const copy = (src: string, dst: string) => {
    const stat = fs.statSync(src);
    if (stat.isDirectory()) {
      fs.mkdirSync(dst, { recursive: true });
      for (const file of fs.readdirSync(src)) {
        if (file === "node_modules" || file === "artifacts" || file === "cache") {
          continue;
        }
        copy(path.join(src, file), path.join(dst, file));
      }
    } else {
      fs.copyFileSync(src, dst);
    }
  };

  copy(source, destination);
}

function generateReadme(outputPath: string, config: ExampleConfig) {
  const readme = `# ${config.title}

${config.description}

## FHEVM Concepts

This example demonstrates:
- **Encrypted State Variables**: Using encrypted types for confidential data
- **Access Control Patterns**: Implementing FHE.allow() and FHE.allowThis()
- **Input Encryption**: Converting public inputs to encrypted types
- **Privacy-Preserving Design**: Protecting user data while maintaining functionality

## File Structure

\`\`\`
contracts/
  Example.sol        # Smart contract implementation
test/
  Example.ts         # Test suite with examples
scripts/
  deploy.ts          # Deployment script
  initialize-demo.ts # Demo initialization
hardhat.config.ts    # Hardhat configuration
package.json         # Dependencies
\`\`\`

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

\`\`\`bash
npm install
\`\`\`

### Compilation

\`\`\`bash
npm run compile
\`\`\`

### Testing

\`\`\`bash
npm run test
\`\`\`

Run specific test file:
\`\`\`bash
npx hardhat test test/Example.ts
\`\`\`

### Deployment (Localhost)

\`\`\`bash
# Start local FHEVM node
npx hardhat node

# In another terminal, deploy
npm run deploy:localhost
\`\`\`

### Deployment (Sepolia Testnet)

\`\`\`bash
# Set environment variables
export SEPOLIA_RPC_URL="https://..."
export PRIVATE_KEY="0x..."

# Deploy
npm run deploy:sepolia
\`\`\`

## Key FHEVM Patterns

### Access Control

\`\`\`solidity
FHE.allowThis(encryptedValue);        // Contract access
FHE.allow(encryptedValue, msg.sender); // User access
\`\`\`

### Input Encryption

\`\`\`solidity
euint32 encrypted = FHE.asEuint32(publicValue);
ebool encrypted = FHE.asEbool(publicBool);
\`\`\`

### Encrypted Operations

\`\`\`solidity
euint32 result = FHE.add(a, b);
euint32 result = FHE.sub(a, b);
ebool result = FHE.eq(a, b);
\`\`\`

## Common Pitfalls

❌ **Missing FHE.allowThis()** - Will cause access denied errors
✅ **Always set both FHE.allowThis() and FHE.allow()**

❌ **Not checking bounds** - Can cause overflow/underflow
✅ **Validate input ranges before encrypting**

❌ **Reentrancy in external calls** - Can be exploited
✅ **Use checks-effects-interactions pattern**

## Testing

The test suite includes:
- ✅ Correct usage examples
- ❌ Anti-patterns showing common mistakes
- 📚 Educational comments explaining FHEVM concepts

Run tests with:
\`\`\`bash
npm run test
\`\`\`

## Documentation

See \`docs/\` directory for detailed documentation:
- Architecture and design patterns
- FHEVM concepts explained
- Best practices and anti-patterns
- Production considerations

## Resources

- [FHEVM Documentation](https://docs.zama.ai/fhevm)
- [Hardhat Documentation](https://hardhat.org)
- [Solidity Documentation](https://docs.soliditylang.org)

## Support

For questions and support:
- [Zama Community Forum](https://www.zama.ai/community)
- [Discord Server](https://discord.com/invite/zama)
- [GitHub Issues](https://github.com/zama-ai/fhevm/issues)

## License

MIT License - See LICENSE file

---

**Category**: ${config.category}
**Tags**: ${config.tags.join(", ")}
`;

  fs.writeFileSync(path.join(outputPath, "README.md"), readme);
}

function updatePackageJson(outputPath: string, config: ExampleConfig) {
  const packageJsonPath = path.join(outputPath, "package.json");
  let packageJson: any = {
    name: config.name,
    version: "1.0.0",
    description: config.description,
    private: true,
    type: "module",
    scripts: {
      compile: "hardhat compile",
      deploy: "hardhat run scripts/deploy.ts",
      "deploy:localhost": "hardhat run scripts/deploy.ts --network localhost",
      "deploy:sepolia": "hardhat run scripts/deploy.ts --network sepolia",
      "init-demo": "hardhat run scripts/initialize-demo.ts --network sepolia",
      test: "hardhat test",
      typecheck: "tsc --noEmit",
      lint: "eslint .",
      clean: "rm -rf artifacts cache typechain-types dist",
    },
    dependencies: {
      ethers: "^6.13.4",
    },
    devDependencies: {
      "@fhevm/solidity": "^0.8.0",
      "@nomicfoundation/hardhat-ethers": "^3.0.8",
      "@nomicfoundation/hardhat-toolbox": "^5.0.0",
      "@types/node": "^20.0.0",
      hardhat: "^2.24.3",
      typescript: "^5.3.3",
    },
  };

  if (fs.existsSync(packageJsonPath)) {
    const existing = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
    packageJson = { ...existing, ...packageJson };
  }

  fs.writeFileSync(
    packageJsonPath,
    JSON.stringify(packageJson, null, 2)
  );
}

function generateGitignore(outputPath: string) {
  const gitignore = `# Dependencies
node_modules/
yarn.lock
package-lock.json

# Build artifacts
artifacts/
cache/
dist/
typechain-types/

# Environment
.env
.env.local
.env.*.local

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Testing
coverage/
.nyc_output/

# Logs
*.log
npm-debug.log*
`;

  fs.writeFileSync(path.join(outputPath, ".gitignore"), gitignore);
}

function createScripts(outputPath: string, config: ExampleConfig) {
  const scriptsDir = path.join(outputPath, "scripts");
  fs.mkdirSync(scriptsDir, { recursive: true });

  // Create deploy.ts
  const deployScript = `import { ethers } from "hardhat";

async function main() {
  console.log("Deploying ${config.title}...");

  const factory = await ethers.getContractFactory("Example");
  const contract = await factory.deploy();

  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("✅ Contract deployed to:", address);

  // Save deployment address
  const fs = require("fs");
  const deploymentInfo = {
    network: (await ethers.provider.getNetwork()).name,
    address: address,
    blockNumber: await ethers.provider.getBlockNumber(),
    timestamp: new Date().toISOString(),
  };

  fs.writeFileSync(
    "deployment.json",
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log("📝 Deployment info saved to deployment.json");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
`;

  fs.writeFileSync(path.join(scriptsDir, "deploy.ts"), deployScript);

  // Create initialize-demo.ts
  const initScript = `import { ethers } from "hardhat";

async function main() {
  console.log("Initializing demo...");

  const contractAddress = "0x..."; // Replace with deployed address
  const contract = await ethers.getContractAt("Example", contractAddress);

  console.log("✅ Demo initialized");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
`;

  fs.writeFileSync(path.join(scriptsDir, "initialize-demo.ts"), initScript);

  // Create README.md for scripts
  const scriptsReadme = `# Deployment Scripts

This directory contains automated deployment and initialization scripts.

## Available Scripts

### deploy.ts
Deploys the contract to the specified network.

\`\`\`bash
npx hardhat run scripts/deploy.ts --network localhost
npx hardhat run scripts/deploy.ts --network sepolia
\`\`\`

Output: \`deployment.json\` with contract address and metadata

### initialize-demo.ts
Initializes demo data after deployment.

\`\`\`bash
npx hardhat run scripts/initialize-demo.ts --network sepolia
\`\`\`

## Configuration

Set network RPC URLs in environment variables:
- \`SEPOLIA_RPC_URL\` - Sepolia testnet RPC endpoint
- \`PRIVATE_KEY\` - Deployer private key

Or configure in \`hardhat.config.ts\`

## Usage

1. Deploy contract:
   \`\`\`bash
   npm run deploy:sepolia
   \`\`\`

2. Initialize demo (optional):
   \`\`\`bash
   npm run init-demo
   \`\`\`

3. Verify deployment:
   - Check \`deployment.json\` for contract address
   - View on [Etherscan](https://sepolia.etherscan.io)
`;

  fs.writeFileSync(path.join(scriptsDir, "README.md"), scriptsReadme);
}

// Main execution
const args = process.argv.slice(2);
const exampleName = args[0] || "prediction-market";
const outputPath = args[1] || path.join(process.cwd(), exampleName);

createExample(exampleName, outputPath).catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
