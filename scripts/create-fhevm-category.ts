#!/usr/bin/env ts-node

/**
 * Automation Script: Create Category-Based Project
 *
 * This script generates projects containing multiple related FHEVM examples
 * from a specific category (basic, advanced, etc.).
 *
 * Usage:
 *   ts-node scripts/create-fhevm-category.ts <category> <output-path>
 *   ts-node scripts/create-fhevm-category.ts basic ../my-examples/basic-examples
 *
 * Available Categories:
 *   - basic: FHECounter, encryption, arithmetic operations
 *   - advanced: Prediction Market and complex patterns
 */

import * as fs from "fs";
import * as path from "path";

interface CategoryConfig {
  name: string;
  title: string;
  description: string;
  contracts: string[];
  tests: string[];
}

const CATEGORIES: Record<string, CategoryConfig> = {
  basic: {
    name: "basic",
    title: "Basic FHEVM Examples",
    description: "Fundamental FHEVM patterns including encryption, access control, and arithmetic",
    contracts: [
      "contracts/basic/FHECounter.sol",
      "contracts/basic/EncryptSingleValue.sol",
      "contracts/basic/FHEAdd.sol",
      "contracts/basic/AccessControlExample.sol",
    ],
    tests: [
      "test/basic/FHECounter.ts",
      "test/basic/EncryptSingleValue.ts",
    ],
  },
  advanced: {
    name: "advanced",
    title: "Advanced FHEVM Examples",
    description: "Complex real-world applications using FHEVM",
    contracts: ["contracts/PredictionMarket.sol"],
    tests: ["test/PredictionMarket.ts"],
  },
};

async function createCategory(categoryName: string, outputPath: string) {
  const config = CATEGORIES[categoryName];

  if (!config) {
    console.error(
      `❌ Category "${categoryName}" not found. Available categories:`,
      Object.keys(CATEGORIES)
    );
    process.exit(1);
  }

  console.log(`📦 Creating "${config.title}" project...`);
  console.log(`📁 Output directory: ${outputPath}\n`);

  try {
    // Step 1: Create output directory
    if (fs.existsSync(outputPath)) {
      console.log(`⚠️  Directory already exists, removing...`);
      fs.rmSync(outputPath, { recursive: true, force: true });
    }
    fs.mkdirSync(outputPath, { recursive: true });
    console.log(`✅ Created output directory\n`);

    // Step 2: Copy base template
    const baseTemplatePath = path.join(__dirname, "..", "base-template");
    if (fs.existsSync(baseTemplatePath)) {
      copyDirectory(baseTemplatePath, outputPath);
      console.log(`✅ Copied base template\n`);
    } else {
      createMinimalTemplate(outputPath);
      console.log(`✅ Created minimal template\n`);
    }

    // Step 3: Copy contracts
    console.log(`📄 Copying ${config.contracts.length} contracts...`);
    const contractsDir = path.join(outputPath, "contracts");
    fs.mkdirSync(contractsDir, { recursive: true });

    for (const contractPath of config.contracts) {
      const sourcePath = path.join(__dirname, "..", contractPath);
      if (fs.existsSync(sourcePath)) {
        const fileName = path.basename(contractPath);
        const destPath = path.join(contractsDir, fileName);
        fs.copyFileSync(sourcePath, destPath);
        console.log(`  ✓ ${fileName}`);
      }
    }
    console.log();

    // Step 4: Copy tests
    console.log(`🧪 Copying ${config.tests.length} test files...`);
    const testsDir = path.join(outputPath, "test");
    fs.mkdirSync(testsDir, { recursive: true });

    for (const testPath of config.tests) {
      const sourcePath = path.join(__dirname, "..", testPath);
      if (fs.existsSync(sourcePath)) {
        const fileName = path.basename(testPath);
        const destPath = path.join(testsDir, fileName);
        fs.copyFileSync(sourcePath, destPath);
        console.log(`  ✓ ${fileName}`);
      }
    }
    console.log();

    // Step 5: Generate README
    generateCategoryReadme(outputPath, config);
    console.log(`✅ Generated README.md\n`);

    // Step 6: Update package.json
    updatePackageJson(outputPath, config);
    console.log(`✅ Updated package.json\n`);

    // Step 7: Create deployment script
    createDeploymentScript(outputPath, config);
    console.log(`✅ Generated deployment script\n`);

    console.log("✨ Category project created successfully!\n");
    console.log("📝 Next steps:");
    console.log(`   cd ${outputPath}`);
    console.log("   npm install");
    console.log("   npm run compile");
    console.log("   npm run test");
  } catch (error) {
    console.error("❌ Error creating category project:", error);
    process.exit(1);
  }
}

function copyDirectory(source: string, destination: string) {
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

function createMinimalTemplate(outputPath: string) {
  const dirs = ["contracts", "test", "scripts"];
  for (const dir of dirs) {
    fs.mkdirSync(path.join(outputPath, dir), { recursive: true });
  }

  const hardhatConfig = `import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@fhevm/hardhat-plugin";
import "dotenv/config";

const config: HardhatUserConfig = {
  solidity: "0.8.25",
  networks: {
    hardhat: {},
    localhost: { url: "http://127.0.0.1:8545" },
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || "",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
  },
};

export default config;
`;

  fs.writeFileSync(path.join(outputPath, "hardhat.config.ts"), hardhatConfig);
}

function generateCategoryReadme(outputPath: string, config: CategoryConfig) {
  const contractsList = config.contracts
    .map((c) => `- ${path.basename(c)}`)
    .join("\n");

  const readme = `# ${config.title}

${config.description}

## Examples Included

### Contracts
${contractsList}

### Tests
${config.tests.map((t) => `- ${path.basename(t)}`).join("\n")}

## Quick Start

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

Run specific test:
\`\`\`bash
npx hardhat test test/<TestFile>.ts
\`\`\`

### Deployment

\`\`\`bash
# Deploy to localhost
npm run deploy:localhost

# Deploy to Sepolia
npm run deploy:sepolia
\`\`\`

## FHEVM Concepts

This category demonstrates:

- **Encrypted Types**: \`euint32\`, \`ebool\`, etc.
- **Access Control**: \`FHE.allowThis()\` and \`FHE.allow()\`
- **Input Encryption**: \`FHE.fromExternal()\` with proofs
- **Encrypted Operations**: \`FHE.add()\`, \`FHE.sub()\`, etc.

## Example Workflow

1. **Read contracts** in \`contracts/\` to understand patterns
2. **Study tests** in \`test/\` for usage examples
3. **Run tests** to see concepts in action
4. **Deploy locally** to experiment
5. **Deploy to testnet** for live testing

## Common Patterns

### Input Encryption

\`\`\`typescript
const encryptedInput = await fhevm
  .createEncryptedInput(contractAddress, userAddress)
  .add32(value)
  .encrypt();

await contract.operation(encryptedInput.handles[0], encryptedInput.inputProof);
\`\`\`

### Access Control

\`\`\`solidity
FHE.allowThis(encryptedValue);        // Contract access
FHE.allow(encryptedValue, msg.sender); // User access
\`\`\`

### User Decryption

\`\`\`typescript
const encrypted = await contract.getValue();
const decrypted = await fhevm.userDecryptEuint(
  FhevmType.euint32,
  encrypted,
  contractAddress,
  userSigner
);
\`\`\`

## Resources

- [FHEVM Documentation](https://docs.zama.ai/fhevm)
- [FHE Types Guide](https://docs.zama.ai/fhevm/fundamentals/types)
- [Access Control](https://docs.zama.ai/fhevm/fundamentals/acl)

## Support

- [Zama Community Forum](https://www.zama.ai/community)
- [Discord Server](https://discord.com/invite/zama)
- [GitHub Issues](https://github.com/zama-ai/fhevm/issues)

## License

MIT License

---

**Category**: ${config.name}
**Examples**: ${config.contracts.length} contracts, ${config.tests.length} test suites
`;

  fs.writeFileSync(path.join(outputPath, "README.md"), readme);
}

function updatePackageJson(outputPath: string, config: CategoryConfig) {
  const packageJson = {
    name: `fhevm-${config.name}-examples`,
    version: "1.0.0",
    description: config.description,
    private: true,
    scripts: {
      compile: "hardhat compile",
      test: "hardhat test",
      "deploy:localhost": "hardhat run scripts/deploy.ts --network localhost",
      "deploy:sepolia": "hardhat run scripts/deploy.ts --network sepolia",
      typecheck: "tsc --noEmit",
      lint: "eslint . --ext .ts",
      clean: "rm -rf artifacts cache typechain-types dist",
    },
    keywords: ["fhevm", "encryption", "privacy", config.name],
    license: "MIT",
    devDependencies: {
      "@fhevm/hardhat-plugin": "^0.3.0",
      "@fhevm/solidity": "^0.8.0",
      "@nomicfoundation/hardhat-ethers": "^3.0.8",
      "@nomicfoundation/hardhat-toolbox": "^5.0.0",
      "@types/node": "^20.0.0",
      ethers: "^6.13.4",
      hardhat: "^2.24.3",
      typescript: "^5.3.3",
    },
  };

  fs.writeFileSync(
    path.join(outputPath, "package.json"),
    JSON.stringify(packageJson, null, 2)
  );
}

function createDeploymentScript(outputPath: string, config: CategoryConfig) {
  const contractNames = config.contracts
    .map((c) => path.basename(c, ".sol"))
    .filter((name) => name !== "AccessControlExample"); // Skip examples

  const deployments = contractNames
    .map(
      (name) => `
  // Deploy ${name}
  console.log("Deploying ${name}...");
  const ${name}Factory = await ethers.getContractFactory("${name}");
  const ${name.toLowerCase()} = await ${name}Factory.deploy();
  await ${name.toLowerCase()}.waitForDeployment();
  const ${name.toLowerCase()}Address = await ${name.toLowerCase()}.getAddress();
  console.log("${name} deployed to:", ${name.toLowerCase()}Address);
  deployments.${name} = ${name.toLowerCase()}Address;
`
    )
    .join("\n");

  const deployScript = `import { ethers } from "hardhat";
import * as fs from "fs";

async function main() {
  console.log("Deploying ${config.title}...\n");

  const deployments: Record<string, string> = {};
${deployments}
  // Save deployment addresses
  const deploymentInfo = {
    network: (await ethers.provider.getNetwork()).name,
    chainId: (await ethers.provider.getNetwork()).chainId,
    deployments: deployments,
    timestamp: new Date().toISOString(),
  };

  fs.writeFileSync(
    "deployments.json",
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log("\\n✅ All contracts deployed");
  console.log("📝 Deployment info saved to deployments.json");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
`;

  const scriptsDir = path.join(outputPath, "scripts");
  fs.mkdirSync(scriptsDir, { recursive: true });
  fs.writeFileSync(path.join(scriptsDir, "deploy.ts"), deployScript);
}

// Main execution
const args = process.argv.slice(2);

if (args.length === 0 || args[0] === "--help") {
  console.log(`
Category-Based Project Generator for FHEVM Examples

Usage:
  ts-node scripts/create-fhevm-category.ts <category> <output-path>

Examples:
  ts-node scripts/create-fhevm-category.ts basic ../my-examples/basic
  ts-node scripts/create-fhevm-category.ts advanced ../my-examples/advanced

Available categories:
  ${Object.keys(CATEGORIES)
    .map((key) => `${key} - ${CATEGORIES[key].description}`)
    .join("\n  ")}

Options:
  --help    Show this help message
`);
  process.exit(0);
}

const categoryName = args[0];
const outputPath = args[1] || path.join(process.cwd(), `${categoryName}-examples`);

createCategory(categoryName, outputPath).catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
