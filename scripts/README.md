# Automation Scripts

This directory contains TypeScript-based automation tools for generating standalone FHEVM example repositories and documentation.

## Available Scripts

### create-example.ts

Generates complete standalone FHEVM example repositories from contracts and tests.

**Usage:**
```bash
ts-node scripts/create-example.ts <example-name> <output-path>
ts-node scripts/create-example.ts prediction-market ../my-examples/
```

**What it does:**
1. Creates output directory structure
2. Copies base Hardhat template configuration
3. Copies contract and test files
4. Generates customized README
5. Updates package.json with appropriate dependencies
6. Creates deployment scripts
7. Generates .gitignore

**Output:**
A complete, self-contained repository with:
- Configured Hardhat setup
- Contract and test files
- Deployment automation
- Documentation
- All dependencies listed in package.json

### generate-docs.ts

Automatically generates GitBook-compatible documentation from annotated code.

**Usage:**
```bash
ts-node scripts/generate-docs.ts prediction-market
ts-node scripts/generate-docs.ts --all
```

**What it does:**
1. Reads contract and test source files
2. Extracts code snippets and annotations
3. Generates markdown documentation
4. Updates SUMMARY.md for GitBook indexing
5. Organizes by category and tags

**Output:**
- Markdown files in `docs/` directory
- Updated SUMMARY.md with navigation
- Code examples with syntax highlighting
- Structured educational content

### deploy.ts

Deploys contracts to specified network.

**Usage:**
```bash
npx hardhat run scripts/deploy.ts --network localhost
npx hardhat run scripts/deploy.ts --network sepolia
```

**Configuration:**
Set environment variables:
```bash
export SEPOLIA_RPC_URL="https://..."
export PRIVATE_KEY="0x..."
```

**Output:**
- Deployed contract address
- deployment.json with metadata

### initialize-demo.ts

Initializes demo data for deployed contracts.

**Usage:**
```bash
npx hardhat run scripts/initialize-demo.ts --network sepolia
```

**Prerequisites:**
- Contract must be deployed
- Update contract address in script

## Development Workflow

### Creating a New Example

1. **Write the Contract**
   - Place in `contracts/YourExample.sol`
   - Include detailed comments explaining FHEVM concepts
   - Demonstrate both correct usage and common pitfalls

2. **Write Comprehensive Tests**
   - Place in `test/YourExample.ts`
   - Include ✅ correct usage examples
   - Include ❌ anti-pattern examples
   - Add explanatory comments

3. **Update Script Configurations**

   In `create-example.ts`, add to `EXAMPLES_MAP`:
   ```typescript
   "your-example": {
     name: "your-example",
     title: "Your Example Title",
     description: "Brief description",
     contractFile: "contracts/YourExample.sol",
     testFile: "test/YourExample.ts",
     category: "basic",
     tags: ["encryption", "access-control"],
   }
   ```

   In `generate-docs.ts`, add to `EXAMPLES_CONFIG`:
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

4. **Generate Documentation**
   ```bash
   ts-node scripts/generate-docs.ts your-example
   ```

5. **Test Standalone Repository**
   ```bash
   ts-node scripts/create-example.ts your-example ./test-output
   cd test-output
   npm install
   npm run compile
   npm run test
   ```

### Updating Dependencies

When `@fhevm/solidity` releases a new version:

1. **Update Base Template**
   - Update package.json dependencies
   - Test compilation and tests
   - Fix any breaking changes

2. **Update Automation Scripts**
   - Update version numbers in `create-example.ts`
   - Test generated repositories
   - Update documentation if needed

3. **Regenerate Examples**
   ```bash
   ts-node scripts/create-example.ts prediction-market ./test-output
   cd test-output && npm install && npm test
   ```

4. **Update Documentation**
   ```bash
   ts-node scripts/generate-docs.ts --all
   ```

## Script Architecture

### create-example.ts

```
createExample()
├── createMinimalTemplate()  # Generate base Hardhat setup
├── copyTemplate()            # Copy from base-template if exists
├── generateReadme()          # Create customized README
├── updatePackageJson()       # Set dependencies and scripts
├── generateGitignore()       # Create .gitignore
└── createScripts()           # Generate deploy and init scripts
```

**Key Functions:**
- `createMinimalTemplate()` - Creates hardhat.config.ts and tsconfig.json
- `copyTemplate()` - Recursively copies template files
- `generateReadme()` - Generates README with quick start guide
- `updatePackageJson()` - Merges default and custom package.json
- `createScripts()` - Generates deployment automation

### generate-docs.ts

```
generateDocs()
├── extractSections()         # Parse contract and test files
├── generateMarkdown()        # Create formatted documentation
└── updateSummary()           # Update SUMMARY.md index
```

**Key Functions:**
- `extractSections()` - Uses regex to extract code blocks
- `generateMarkdown()` - Formats documentation with code snippets
- `updateSummary()` - Maintains GitBook navigation

## Testing Automation Scripts

### Test create-example.ts

```bash
# Create test output directory
mkdir -p ../test-output

# Generate example
ts-node scripts/create-example.ts prediction-market ../test-output/pm-test

# Verify structure
ls ../test-output/pm-test
# Should contain: contracts/, test/, scripts/, package.json, README.md, hardhat.config.ts

# Test compilation
cd ../test-output/pm-test
npm install
npm run compile
npm run test
```

### Test generate-docs.ts

```bash
# Generate docs
ts-node scripts/generate-docs.ts prediction-market

# Verify output
cat docs/prediction-market.md
cat docs/SUMMARY.md

# Check for proper formatting
grep "```solidity" docs/prediction-market.md
grep "## " docs/prediction-market.md
```

## Troubleshooting

### Script Execution Errors

**Problem:** `Cannot find module 'fs'`
**Solution:** Ensure you're using ts-node:
```bash
npm install -g ts-node
ts-node scripts/create-example.ts ...
```

**Problem:** `Permission denied`
**Solution:** Make scripts executable:
```bash
chmod +x scripts/*.ts
```

**Problem:** Template not found
**Solution:** Create minimal template (handled automatically) or provide base-template directory

### Generated Repository Issues

**Problem:** Compilation fails in generated repo
**Solution:** Check dependency versions in package.json match working versions

**Problem:** Tests fail in generated repo
**Solution:** Verify test files copied correctly and typechain-types are generated

**Problem:** Deployment script errors
**Solution:** Set environment variables and check network configuration

## Best Practices

### Code Organization

1. **Keep scripts modular** - Separate functions for each task
2. **Use TypeScript** - Better type safety and IDE support
3. **Error handling** - Wrap operations in try-catch blocks
4. **Logging** - Use console.log for progress indicators

### Documentation Generation

1. **Comment everything** - Comments become documentation
2. **Use markers** - ✅ for correct, ❌ for incorrect
3. **Explain why** - Don't just show code, explain the reasoning
4. **Test coverage** - Document both success and failure cases

### Template Management

1. **Version control** - Track template changes
2. **Minimal dependencies** - Only include what's necessary
3. **Configuration files** - Keep configs simple and well-documented
4. **Examples** - Include working examples in comments

## Contributing

When adding new automation:

1. **Document thoroughly** - Update this README
2. **Test extensively** - Verify on clean environment
3. **Follow patterns** - Match existing script structure
4. **Error messages** - Provide helpful error messages
5. **Help text** - Include --help option

## Resources

- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [Node.js File System](https://nodejs.org/api/fs.html)
- [GitBook Documentation](https://docs.gitbook.com/)
- [Hardhat Documentation](https://hardhat.org/docs)

## License

MIT License - Free for educational and commercial use

---

**Maintained for Zama FHEVM Bounty Program December 2025**
