import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, fhevm } from "hardhat";
import { FHECounter } from "../../typechain-types";
import { expect } from "chai";
import { FhevmType } from "@fhevm/hardhat-plugin";

/**
 * Test Suite: FHE Counter
 *
 * This test demonstrates:
 * - Basic encrypted counter operations
 * - FHE.add() and FHE.sub() on encrypted values
 * - Proper access control with FHE.allowThis() and FHE.allow()
 * - User decryption of encrypted state
 */
describe("FHECounter", function () {
  let signers: { alice: HardhatEthersSigner; bob: HardhatEthersSigner };
  let contract: FHECounter;
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

    const factory = await ethers.getContractFactory("FHECounter");
    contract = await factory.deploy() as FHECounter;
    contractAddress = await contract.getAddress();
  });

  /**
   * ✅ CORRECT: Counter starts uninitialized
   */
  it("should have uninitialized count after deployment", async function () {
    const encryptedCount = await contract.getCount();
    expect(encryptedCount).to.eq(ethers.ZeroHash);
  });

  /**
   * ✅ CORRECT: Increment counter with encrypted value
   *
   * Pattern:
   * 1. Create encrypted input with proof
   * 2. Send to contract
   * 3. Contract increments and sets permissions
   * 4. User can decrypt their value
   */
  it("should increment counter by encrypted value", async function () {
    const incrementBy = 5;

    // Create encrypted input
    const encryptedInput = await fhevm
      .createEncryptedInput(contractAddress, signers.alice.address)
      .add32(incrementBy)
      .encrypt();

    // Increment
    const tx = await contract
      .connect(signers.alice)
      .increment(encryptedInput.handles[0], encryptedInput.inputProof);
    await tx.wait();

    // Decrypt and verify
    const encryptedCount = await contract.getCount();
    const decryptedCount = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      encryptedCount,
      contractAddress,
      signers.alice
    );

    expect(decryptedCount).to.equal(incrementBy);
  });

  /**
   * ✅ CORRECT: Multiple increments accumulate
   */
  it("should accumulate multiple increments", async function () {
    const values = [3, 7, 2];
    const expectedTotal = values.reduce((a, b) => a + b, 0);

    for (const value of values) {
      const encryptedInput = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add32(value)
        .encrypt();

      const tx = await contract
        .connect(signers.alice)
        .increment(encryptedInput.handles[0], encryptedInput.inputProof);
      await tx.wait();
    }

    const encryptedCount = await contract.getCount();
    const decryptedCount = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      encryptedCount,
      contractAddress,
      signers.alice
    );

    expect(decryptedCount).to.equal(expectedTotal);
  });

  /**
   * ✅ CORRECT: Decrement works properly
   */
  it("should decrement counter by encrypted value", async function () {
    // First increment to 10
    const initialValue = 10;
    let encryptedInput = await fhevm
      .createEncryptedInput(contractAddress, signers.alice.address)
      .add32(initialValue)
      .encrypt();

    await contract
      .connect(signers.alice)
      .increment(encryptedInput.handles[0], encryptedInput.inputProof);

    // Then decrement by 3
    const decrementBy = 3;
    encryptedInput = await fhevm
      .createEncryptedInput(contractAddress, signers.alice.address)
      .add32(decrementBy)
      .encrypt();

    const tx = await contract
      .connect(signers.alice)
      .decrement(encryptedInput.handles[0], encryptedInput.inputProof);
    await tx.wait();

    // Verify
    const encryptedCount = await contract.getCount();
    const decryptedCount = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      encryptedCount,
      contractAddress,
      signers.alice
    );

    expect(decryptedCount).to.equal(initialValue - decrementBy);
  });

  /**
   * ✅ CORRECT: Reset counter to zero
   */
  it("should reset counter to zero", async function () {
    // Increment first
    const encryptedInput = await fhevm
      .createEncryptedInput(contractAddress, signers.alice.address)
      .add32(42)
      .encrypt();

    await contract
      .connect(signers.alice)
      .increment(encryptedInput.handles[0], encryptedInput.inputProof);

    // Reset
    const tx = await contract.connect(signers.alice).reset();
    await tx.wait();

    // Verify
    const encryptedCount = await contract.getCount();
    const decryptedCount = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      encryptedCount,
      contractAddress,
      signers.alice
    );

    expect(decryptedCount).to.equal(0);
  });

  /**
   * ✅ CORRECT: Multiple users can interact independently
   *
   * Shows that permissions are properly set for each user
   */
  it("should handle multiple users correctly", async function () {
    const aliceValue = 10;
    const bobValue = 20;

    // Alice increments
    let encryptedInput = await fhevm
      .createEncryptedInput(contractAddress, signers.alice.address)
      .add32(aliceValue)
      .encrypt();

    await contract
      .connect(signers.alice)
      .increment(encryptedInput.handles[0], encryptedInput.inputProof);

    // Bob increments
    encryptedInput = await fhevm
      .createEncryptedInput(contractAddress, signers.bob.address)
      .add32(bobValue)
      .encrypt();

    await contract
      .connect(signers.bob)
      .increment(encryptedInput.handles[0], encryptedInput.inputProof);

    // Verify final count
    const encryptedCount = await contract.getCount();
    const decryptedCount = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      encryptedCount,
      contractAddress,
      signers.alice
    );

    expect(decryptedCount).to.equal(aliceValue + bobValue);
  });

  /**
   * ✅ EDUCATIONAL: Events are emitted correctly
   */
  it("should emit events on operations", async function () {
    const encryptedInput = await fhevm
      .createEncryptedInput(contractAddress, signers.alice.address)
      .add32(1)
      .encrypt();

    // Test increment event
    await expect(
      contract
        .connect(signers.alice)
        .increment(encryptedInput.handles[0], encryptedInput.inputProof)
    )
      .to.emit(contract, "CounterIncremented")
      .withArgs(signers.alice.address, await ethers.provider.getBlock("latest").then(b => b!.timestamp + 1));

    // Test decrement event
    await expect(
      contract
        .connect(signers.alice)
        .decrement(encryptedInput.handles[0], encryptedInput.inputProof)
    )
      .to.emit(contract, "CounterDecremented")
      .withArgs(signers.alice.address, await ethers.provider.getBlock("latest").then(b => b!.timestamp + 1));
  });

  /**
   * 📚 EDUCATIONAL: Demonstrates why access control matters
   *
   * Without FHE.allowThis() and FHE.allow(), the contract and users
   * wouldn't be able to access encrypted values
   */
  it("explains access control pattern", async function () {
    // When increment() is called:
    // 1. FHE.fromExternal() converts proof to encrypted value
    // 2. FHE.add() performs operation
    // 3. FHE.allowThis(_count) - contract can access
    // 4. FHE.allow(_count, msg.sender) - user can decrypt

    // Without step 3: Contract couldn't return the value
    // Without step 4: User couldn't decrypt their value

    const encryptedInput = await fhevm
      .createEncryptedInput(contractAddress, signers.alice.address)
      .add32(1)
      .encrypt();

    const tx = await contract
      .connect(signers.alice)
      .increment(encryptedInput.handles[0], encryptedInput.inputProof);
    await tx.wait();

    // This succeeds because permissions were properly set
    const encryptedCount = await contract.getCount();
    const decryptedCount = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      encryptedCount,
      contractAddress,
      signers.alice
    );

    expect(decryptedCount).to.be.greaterThan(0);
  });
});
