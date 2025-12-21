#!/usr/bin/env ts-node

/**
 * Automation Script: Generate Documentation from Code
 *
 * This script automatically generates GitBook-compatible documentation
 * from contract and test files with annotations.
 *
 * Usage:
 *   ts-node scripts/generate-docs.ts [example-name]
 *   ts-node scripts/generate-docs.ts prediction-market
 *   ts-node scripts/generate-docs.ts --all
 *
 * Features:
 *   - Extracts code snippets from contracts and tests
 *   - Generates markdown documentation
 *   - Updates SUMMARY.md for GitBook index
 *   - Supports multi-file documentation
 */

import * as fs from "fs";
import * as path from "path";

interface DocSection {
  title: string;
  content: string;
  code?: string;
  language?: string;
}

interface ExampleDoc {
  name: string;
  title: string;
  description: string;
  sections: DocSection[];
  category: string;
  tags: string[];
}

const EXAMPLES_CONFIG: Record<string, ExampleDoc> = {
  "prediction-market": {
    name: "prediction-market",
    title: "Confidential Prediction Market",
    description:
      "Privacy-preserving prediction market using FHEVM encrypted betting",
    sections: [],
    category: "advanced",
    tags: ["privacy", "market", "access-control", "encryption"],
  },
};

async function generateDocs(exampleName: string) {
  const config = EXAMPLES_CONFIG[exampleName];

  if (!config) {
    console.error(
      `❌ Example "${exampleName}" not found. Available examples:`,
      Object.keys(EXAMPLES_CONFIG)
    );
    process.exit(1);
  }

  console.log(`📝 Generating documentation for "${config.title}"...\n`);

  try {
    // Read source files
    const contractPath = path.join(
      __dirname,
      "..",
      "contracts",
      "PredictionMarket.sol"
    );
    const testPath = path.join(
      __dirname,
      "..",
      "test",
      "PredictionMarket.ts"
    );

    const contractCode = fs.existsSync(contractPath)
      ? fs.readFileSync(contractPath, "utf-8")
      : "";
    const testCode = fs.existsSync(testPath)
      ? fs.readFileSync(testPath, "utf-8")
      : "";

    // Extract sections
    config.sections = extractSections(contractCode, testCode);

    // Generate markdown
    const markdown = generateMarkdown(config);

    // Write to docs directory
    const docsDir = path.join(__dirname, "..", "docs");
    fs.mkdirSync(docsDir, { recursive: true });

    const outputPath = path.join(docsDir, `${config.name}.md`);
    fs.writeFileSync(outputPath, markdown);

    console.log(`✅ Generated: ${outputPath}\n`);

    // Update SUMMARY.md
    updateSummary(docsDir, config);
    console.log(`✅ Updated SUMMARY.md\n`);

    console.log("✨ Documentation generated successfully!");
  } catch (error) {
    console.error("❌ Error generating documentation:", error);
    process.exit(1);
  }
}

function extractSections(
  contractCode: string,
  testCode: string
): DocSection[] {
  const sections: DocSection[] = [];

  // Add overview section
  sections.push({
    title: "Overview",
    content:
      "This example demonstrates a confidential prediction market where bet amounts and predictions remain encrypted using FHEVM.",
  });

  // Extract struct definitions
  const structMatch = contractCode.match(/struct Bet \{[\s\S]*?\}/);
  if (structMatch) {
    sections.push({
      title: "Encrypted State Variables",
      content:
        "The contract uses FHEVM's encrypted types to protect sensitive user data:",
      code: structMatch[0],
      language: "solidity",
    });
  }

  // Extract placeBet function
  const placeBetMatch = contractCode.match(
    /function placeBet[\s\S]*?(?=\n    function|\n\})/
  );
  if (placeBetMatch) {
    sections.push({
      title: "Placing Encrypted Bets",
      content:
        "The placeBet function demonstrates FHE access control patterns:",
      code: placeBetMatch[0],
      language: "solidity",
    });
  }

  // Extract test examples
  const testMatches = testCode.match(
    /it\("should [\s\S]*?(?=\n  it\(|describe\(|\}\);$)/g
  );
  if (testMatches && testMatches.length > 0) {
    const exampleTest = testMatches[0];
    sections.push({
      title: "Testing Example",
      content: "The test suite demonstrates correct FHEVM usage patterns:",
      code: exampleTest.substring(0, 500) + "...",
      language: "typescript",
    });
  }

  return sections;
}

function generateMarkdown(config: ExampleDoc): string {
  let markdown = `# ${config.title}\n\n`;
  markdown += `${config.description}\n\n`;

  markdown += `## Category: ${config.category}\n\n`;
  markdown += `**Tags:** ${config.tags.join(", ")}\n\n`;

  markdown += `---\n\n`;

  for (const section of config.sections) {
    markdown += `## ${section.title}\n\n`;
    markdown += `${section.content}\n\n`;

    if (section.code && section.language) {
      markdown += `\`\`\`${section.language}\n`;
      markdown += section.code.trim();
      markdown += `\n\`\`\`\n\n`;
    }
  }

  markdown += `## File Locations\n\n`;
  markdown += `To run this example correctly, place files in these directories:\n\n`;
  markdown += `\`\`\`\n`;
  markdown += `contracts/PredictionMarket.sol    → <project-root>/contracts/\n`;
  markdown += `test/PredictionMarket.ts          → <project-root>/test/\n`;
  markdown += `\`\`\`\n\n`;
  markdown += `This ensures Hardhat can compile and test your contracts as expected.\n\n`;

  markdown += `## Quick Start\n\n`;
  markdown += `### Installation\n\n`;
  markdown += `\`\`\`bash\n`;
  markdown += `npm install\n`;
  markdown += `\`\`\`\n\n`;

  markdown += `### Compilation\n\n`;
  markdown += `\`\`\`bash\n`;
  markdown += `npm run compile\n`;
  markdown += `\`\`\`\n\n`;

  markdown += `### Testing\n\n`;
  markdown += `\`\`\`bash\n`;
  markdown += `npm run test\n`;
  markdown += `\`\`\`\n\n`;

  markdown += `### Deployment\n\n`;
  markdown += `\`\`\`bash\n`;
  markdown += `# Deploy to Sepolia testnet\n`;
  markdown += `npm run deploy:sepolia\n`;
  markdown += `\`\`\`\n\n`;

  markdown += `## Key FHEVM Concepts\n\n`;
  markdown += `### Access Control\n\n`;
  markdown += `\`\`\`solidity\n`;
  markdown += `FHE.allowThis(encryptedValue);        // Contract access\n`;
  markdown += `FHE.allow(encryptedValue, msg.sender); // User access\n`;
  markdown += `\`\`\`\n\n`;

  markdown += `### Input Encryption\n\n`;
  markdown += `\`\`\`solidity\n`;
  markdown += `euint32 encrypted = FHE.asEuint32(publicValue);\n`;
  markdown += `ebool encrypted = FHE.asEbool(publicBool);\n`;
  markdown += `\`\`\`\n\n`;

  markdown += `## Common Pitfalls\n\n`;
  markdown += `❌ **Missing FHE.allowThis()** - Will cause access denied errors\n\n`;
  markdown += `✅ **Always set both FHE.allowThis() and FHE.allow()**\n\n`;
  markdown += `❌ **Not checking bounds** - Can cause overflow/underflow\n\n`;
  markdown += `✅ **Validate input ranges before encrypting**\n\n`;

  markdown += `## Resources\n\n`;
  markdown += `- [FHEVM Documentation](https://docs.zama.ai/fhevm)\n`;
  markdown += `- [FHE Types Guide](https://docs.zama.ai/fhevm/fundamentals/types)\n`;
  markdown += `- [Access Control](https://docs.zama.ai/fhevm/fundamentals/acl)\n\n`;

  markdown += `## License\n\n`;
  markdown += `MIT License - Free for educational and commercial use\n\n`;

  markdown += `---\n\n`;
  markdown += `**Built for Zama FHEVM Bounty Program December 2025**\n`;

  return markdown;
}

function updateSummary(docsDir: string, config: ExampleDoc) {
  const summaryPath = path.join(docsDir, "SUMMARY.md");

  let summary = "";
  if (fs.existsSync(summaryPath)) {
    summary = fs.readFileSync(summaryPath, "utf-8");
  } else {
    summary = `# Summary\n\n## FHEVM Examples\n\n`;
  }

  // Check if entry already exists
  const entryRegex = new RegExp(`\\* \\[${config.title}\\]`);
  if (!entryRegex.test(summary)) {
    // Add new entry
    const newEntry = `* [${config.title}](${config.name}.md)\n`;

    // Find appropriate section or add at end
    if (summary.includes("## Advanced Examples")) {
      summary = summary.replace(
        "## Advanced Examples\n",
        `## Advanced Examples\n${newEntry}`
      );
    } else {
      summary += `\n## Advanced Examples\n${newEntry}`;
    }

    fs.writeFileSync(summaryPath, summary);
  }
}

async function generateAllDocs() {
  console.log("📚 Generating documentation for all examples...\n");

  for (const exampleName of Object.keys(EXAMPLES_CONFIG)) {
    await generateDocs(exampleName);
    console.log("");
  }

  console.log("✨ All documentation generated!");
}

// Main execution
const args = process.argv.slice(2);

if (args.length === 0 || args[0] === "--help") {
  console.log(`
Documentation Generator for FHEVM Examples

Usage:
  ts-node scripts/generate-docs.ts <example-name>
  ts-node scripts/generate-docs.ts prediction-market
  ts-node scripts/generate-docs.ts --all

Options:
  --all     Generate documentation for all examples
  --help    Show this help message

Available examples:
  ${Object.keys(EXAMPLES_CONFIG).join("\n  ")}
`);
  process.exit(0);
}

if (args[0] === "--all") {
  generateAllDocs().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
} else {
  const exampleName = args[0];
  generateDocs(exampleName).catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
}
