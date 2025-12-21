import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, fhevm } from "hardhat";
import { EncryptSingleValue } from "../../typechain-types";
import { expect } from "chai";
import { FhevmType } from "@fhevm/hardhat-plugin";

/**
 * Test Suite: Encrypt Single Value
 *
 * This example demonstrates:
 * - How to encrypt a single value
 * - Input proofs and why they're needed
 * - Access control with FHE.allowThis() and FHE.allow()
 * - User decryption workflow
 */
describe("EncryptSingleValue", function () {
  let signers: { alice: HardhatEthersSigner; bob: HardhatEthersSigner };
  let contract: EncryptSingleValue;
  let contractAddress: string;

  before(async function () {
    const [, alice, bob] = await ethers.getSigners();
    signers = { alice, bob };
  });

  beforeEach(async function () {
    if (!fhevm.isMock) {
      console.warn("This test suite runs on FHEVM mock only");
      this.skip();
    }

    const factory = await ethers.getContractFactory("EncryptSingleValue");
    contract = await factory.deploy() as EncryptSingleValue;
    contractAddress = await contract.getAddress();
  });

  /**
   * ✅ CORRECT: Encrypt and store a value with proper workflow
   *
   * Workflow:
   * 1. Create encrypted input locally with proof
   * 2. Send to contract
   * 3. Contract verifies proof and stores encrypted value
   * 4. User can retrieve and decrypt
   */
  it("should encrypt and store a value correctly", async function () {
    const secretValue = 42;

    // Step 1: Create encrypted input
    const encryptedInput = await fhevm
      .createEncryptedInput(contractAddress, signers.alice.address)
      .add32(secretValue)
      .encrypt();

    // Step 2: Send to contract
    const tx = await contract
      .connect(signers.alice)
      .setValue(encryptedInput.handles[0], encryptedInput.inputProof);
    await tx.wait();

    // Step 3: Retrieve encrypted value
    const encryptedValue = await contract.getValue();

    // Step 4: Decrypt
    const decryptedValue = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      encryptedValue,
      contractAddress,
      signers.alice
    );

    expect(decryptedValue).to.equal(secretValue);
  });

  /**
   * ✅ CORRECT: Last setter is tracked correctly
   */
  it("should track last setter address", async function () {
    const encryptedInput = await fhevm
      .createEncryptedInput(contractAddress, signers.alice.address)
      .add32(100)
      .encrypt();

    await contract
      .connect(signers.alice)
      .setValue(encryptedInput.handles[0], encryptedInput.inputProof);

    const lastSetter = await contract.getLastSetter();
    expect(lastSetter).to.equal(signers.alice.address);
  });

  /**
   * ✅ CORRECT: Multiple users can set values
   *
   * Shows that permissions are per-user
   */
  it("should allow multiple users to set values", async function () {
    const aliceValue = 111;
    const bobValue = 222;

    // Alice sets value
    let encryptedInput = await fhevm
      .createEncryptedInput(contractAddress, signers.alice.address)
      .add32(aliceValue)
      .encrypt();

    await contract
      .connect(signers.alice)
      .setValue(encryptedInput.handles[0], encryptedInput.inputProof);

    // Bob sets value (overwrites)
    encryptedInput = await fhevm
      .createEncryptedInput(contractAddress, signers.bob.address)
      .add32(bobValue)
      .encrypt();

    await contract
      .connect(signers.bob)
      .setValue(encryptedInput.handles[0], encryptedInput.inputProof);

    // Value should now be Bob's
    const encryptedValue = await contract.getValue();
    const decryptedValue = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      encryptedValue,
      contractAddress,
      signers.bob
    );

    expect(decryptedValue).to.equal(bobValue);

    // Last setter should be Bob
    const lastSetter = await contract.getLastSetter();
    expect(lastSetter).to.equal(signers.bob.address);
  });

  /**
   * ✅ CORRECT: Event is emitted on encryption
   */
  it("should emit ValueEncrypted event", async function () {
    const encryptedInput = await fhevm
      .createEncryptedInput(contractAddress, signers.alice.address)
      .add32(42)
      .encrypt();

    await expect(
      contract
        .connect(signers.alice)
        .setValue(encryptedInput.handles[0], encryptedInput.inputProof)
    )
      .to.emit(contract, "ValueEncrypted")
      .withArgs(signers.alice.address, await ethers.provider.getBlock("latest").then(b => b!.timestamp + 1));
  });

  /**
   * 📚 EDUCATIONAL: What are input proofs?
   *
   * Input proofs are zero-knowledge proofs that attest:
   * - The encrypted value is properly bound to [contract, user]
   * - The user actually knows the plaintext value
   * - The encryption is valid
   */
  it("explains input proofs concept", async function () {
    // When we call createEncryptedInput():
    // 1. Value is encrypted locally
    // 2. Proof is generated that value is correctly encrypted
    // 3. Both handle and proof sent to contract
    // 4. Contract verifies proof with FHE.fromExternal()

    const encryptedInput = await fhevm
      .createEncryptedInput(contractAddress, signers.alice.address)
      .add32(42)
      .encrypt();

    // encryptedInput contains:
    // - handles[0]: The encrypted value handle
    // - inputProof: Zero-knowledge proof of correct encryption

    const tx = await contract
      .connect(signers.alice)
      .setValue(encryptedInput.handles[0], encryptedInput.inputProof);

    // Transaction succeeds because proof is valid
    expect(tx).to.not.be.undefined;
  });

  /**
   * 📚 EDUCATIONAL: Access control demonstration
   *
   * Shows why both FHE.allowThis() and FHE.allow() are needed
   */
  it("demonstrates access control pattern", async function () {
    // In setValue():
    // FHE.allowThis(value) - Allows contract to access
    // FHE.allow(value, msg.sender) - Allows user to decrypt

    // Without FHE.allowThis():
    // - getValue() would fail (contract can't access)

    // Without FHE.allow():
    // - User decryption would fail

    const encryptedInput = await fhevm
      .createEncryptedInput(contractAddress, signers.alice.address)
      .add32(123)
      .encrypt();

    await contract
      .connect(signers.alice)
      .setValue(encryptedInput.handles[0], encryptedInput.inputProof);

    // Both operations succeed due to proper permissions
    const encryptedValue = await contract.getValue();
    const decryptedValue = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      encryptedValue,
      contractAddress,
      signers.alice
    );

    expect(decryptedValue).to.equal(123);
  });

  /**
   * ❌ ANTI-PATTERN: What happens without input proof
   *
   * This documents why input proofs are required
   */
  it("explains why input proofs are mandatory", async function () {
    // Without input proof, anyone could submit arbitrary encrypted values
    // that aren't properly bound to their address. Input proofs prevent this.

    // The contract REQUIRES both handle and proof:
    // function setValue(externalEuint32 encryptedInput, bytes calldata inputProof)

    // Trying to call with invalid proof would fail at:
    // FHE.fromExternal(encryptedInput, inputProof)

    // This test demonstrates correct usage
    const encryptedInput = await fhevm
      .createEncryptedInput(contractAddress, signers.alice.address)
      .add32(42)
      .encrypt();

    const tx = await contract
      .connect(signers.alice)
      .setValue(encryptedInput.handles[0], encryptedInput.inputProof);

    expect(tx).to.not.be.undefined;
  });

  /**
   * ✅ CORRECT: Overwriting values works
   */
  it("should allow overwriting previous value", async function () {
    const firstValue = 100;
    const secondValue = 200;

    // Set first value
    let encryptedInput = await fhevm
      .createEncryptedInput(contractAddress, signers.alice.address)
      .add32(firstValue)
      .encrypt();

    await contract
      .connect(signers.alice)
      .setValue(encryptedInput.handles[0], encryptedInput.inputProof);

    // Set second value
    encryptedInput = await fhevm
      .createEncryptedInput(contractAddress, signers.alice.address)
      .add32(secondValue)
      .encrypt();

    await contract
      .connect(signers.alice)
      .setValue(encryptedInput.handles[0], encryptedInput.inputProof);

    // Should have second value
    const encryptedValue = await contract.getValue();
    const decryptedValue = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      encryptedValue,
      contractAddress,
      signers.alice
    );

    expect(decryptedValue).to.equal(secondValue);
  });
});
