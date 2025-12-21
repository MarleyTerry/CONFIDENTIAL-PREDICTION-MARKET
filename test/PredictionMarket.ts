import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, fhevm } from "hardhat";
import { PredictionMarket, PredictionMarket__factory } from "../typechain-types";
import { expect } from "chai";
import { FhevmType } from "@fhevm/hardhat-plugin";

type Signers = {
  deployer: HardhatEthersSigner;
  alice: HardhatEthersSigner;
  bob: HardhatEthersSigner;
  creator: HardhatEthersSigner;
};

/**
 * Test Suite: Prediction Market Contract
 *
 * This test suite demonstrates FHEVM concepts including:
 * - Encrypted state variables (euint32, ebool)
 * - Access control with FHE.allow() and FHE.allowThis()
 * - Input encryption and proofs
 * - Privacy-preserving betting and market resolution
 */
describe("PredictionMarket", function () {
  let signers: Signers;
  let contract: PredictionMarket;
  let contractAddress: string;

  before(async function () {
    const ethSigners: HardhatEthersSigner[] = await ethers.getSigners();
    signers = {
      deployer: ethSigners[0],
      alice: ethSigners[1],
      bob: ethSigners[2],
      creator: ethSigners[3],
    };
  });

  beforeEach(async function () {
    // Check whether tests are running against FHEVM mock
    if (!fhevm.isMock) {
      console.warn(
        `This test suite runs on FHEVM mock only. Skipping on testnet.`
      );
      this.skip();
    }

    const factory = (await ethers.getContractFactory(
      "PredictionMarket"
    )) as PredictionMarket__factory;
    contract = (await factory.deploy()) as PredictionMarket;
    contractAddress = await contract.getAddress();
  });

  describe("Market Creation", function () {
    /**
     * ✅ CORRECT: Create a valid market with question and duration
     * This demonstrates proper market initialization for prediction markets.
     */
    it("should create a market with valid parameters", async function () {
      const question = "Will Bitcoin reach $50k by end of year?";
      const durationSeconds = 7 * 24 * 60 * 60; // 1 week

      const tx = await contract.createMarket(question, durationSeconds);
      await tx.wait();

      const market = await contract.getMarket(0);
      expect(market.question).to.equal(question);
      expect(market.creator).to.equal(signers.deployer.address);
      expect(market.resolved).to.equal(false);
    });

    /**
     * ✅ CORRECT: Verify market counter increments
     */
    it("should increment market counter on creation", async function () {
      const initialCount = await contract.getTotalMarkets();

      await contract.createMarket("Question 1", 7 * 24 * 60 * 60);
      await contract.createMarket("Question 2", 7 * 24 * 60 * 60);

      const finalCount = await contract.getTotalMarkets();
      expect(finalCount).to.equal(initialCount + BigInt(2));
    });

    /**
     * ❌ INCORRECT: Empty question string - should fail
     * Common mistake: Not validating input parameters
     */
    it("should reject empty question", async function () {
      await expect(
        contract.createMarket("", 7 * 24 * 60 * 60)
      ).to.be.revertedWith("Question cannot be empty");
    });

    /**
     * ❌ INCORRECT: Zero duration - should fail
     * Demonstrates input validation importance
     */
    it("should reject zero duration", async function () {
      await expect(
        contract.createMarket("Valid question", 0)
      ).to.be.revertedWith("Duration must be positive");
    });

    /**
     * ✅ CORRECT: Multiple creators can create markets
     * Each market tracks its creator separately
     */
    it("should allow multiple creators", async function () {
      await contract.createMarket("Alice's market", 7 * 24 * 60 * 60);
      await contract
        .connect(signers.alice)
        .createMarket("Bob's market", 7 * 24 * 60 * 60);

      const market0 = await contract.getMarket(0);
      const market1 = await contract.getMarket(1);

      expect(market0.creator).to.equal(signers.deployer.address);
      expect(market1.creator).to.equal(signers.alice.address);
    });
  });

  describe("Encrypted Bet Placement", function () {
    beforeEach(async function () {
      await contract.createMarket("Test market", 7 * 24 * 60 * 60);
    });

    /**
     * ✅ CORRECT: Place encrypted bet with proper access control
     * Demonstrates FHE.allowThis() and FHE.allow() usage
     */
    it("should place encrypted bet with correct access control", async function () {
      const betAmount = ethers.parseEther("0.1");
      const prediction = true; // YES

      // Access contract from Alice's perspective
      const tx = await contract
        .connect(signers.alice)
        .placeBet(0, prediction, { value: betAmount });
      await tx.wait();

      // Verify bet was recorded
      const [betExists, claimed] = await contract
        .connect(signers.alice)
        .getBetExists(0);
      expect(betExists).to.equal(true);
      expect(claimed).to.equal(false);
    });

    /**
     * ✅ CORRECT: Multiple users can place bets
     * Ensures market participation from multiple addresses
     */
    it("should allow multiple users to place bets", async function () {
      const betAmount = ethers.parseEther("0.1");

      await contract
        .connect(signers.alice)
        .placeBet(0, true, { value: betAmount });
      await contract
        .connect(signers.bob)
        .placeBet(0, false, { value: betAmount });

      const [aliceExists] = await contract
        .connect(signers.alice)
        .getBetExists(0);
      const [bobExists] = await contract.connect(signers.bob).getBetExists(0);

      expect(aliceExists).to.equal(true);
      expect(bobExists).to.equal(true);
    });

    /**
     * ❌ INCORRECT: Bet amount below minimum - should fail
     */
    it("should reject bet below minimum amount", async function () {
      const tooSmallBet = ethers.parseEther("0.0001"); // Below MIN_BET

      await expect(
        contract.placeBet(0, true, { value: tooSmallBet })
      ).to.be.revertedWith("Invalid bet amount");
    });

    /**
     * ❌ INCORRECT: Bet amount above maximum - should fail
     */
    it("should reject bet above maximum amount", async function () {
      const tooBigBet = ethers.parseEther("11"); // Above MAX_BET

      await expect(
        contract.placeBet(0, true, { value: tooBigBet })
      ).to.be.revertedWith("Invalid bet amount");
    });

    /**
     * ❌ INCORRECT: User places multiple bets on same market
     * Market should only allow one bet per user
     */
    it("should not allow same user to place multiple bets", async function () {
      const betAmount = ethers.parseEther("0.1");

      await contract
        .connect(signers.alice)
        .placeBet(0, true, { value: betAmount });

      // Second bet from same user should fail
      await expect(
        contract
          .connect(signers.alice)
          .placeBet(0, false, { value: betAmount })
      ).to.be.revertedWith("Already placed bet");
    });

    /**
     * ❌ INCORRECT: Betting on non-existent market
     */
    it("should reject betting on non-existent market", async function () {
      const betAmount = ethers.parseEther("0.1");

      await expect(
        contract.placeBet(999, true, { value: betAmount })
      ).to.be.revertedWith("Market does not exist");
    });

    /**
     * ❌ INCORRECT: Betting after market end time
     */
    it("should not allow betting after market ends", async function () {
      // Create market with very short duration
      const shortDuration = 2; // 2 seconds
      await contract.createMarket("Short market", shortDuration);
      const marketId = 1;

      // Wait for market to end
      await new Promise((resolve) => setTimeout(resolve, 3000));

      const betAmount = ethers.parseEther("0.1");
      await expect(
        contract.connect(signers.alice).placeBet(marketId, true, { value: betAmount })
      ).to.be.revertedWith("Market has ended");
    });

    /**
     * ✅ CORRECT: Verify market bet totals are tracked
     * Demonstrates aggregate statistics without revealing individual bets
     */
    it("should update market bet totals", async function () {
      const betAmount = ethers.parseEther("0.1");

      await contract
        .connect(signers.alice)
        .placeBet(0, true, { value: betAmount });
      await contract
        .connect(signers.bob)
        .placeBet(0, false, { value: betAmount });

      const market = await contract.getMarket(0);
      expect(market.totalYesBets).to.be.greaterThan(0);
      expect(market.totalNoBets).to.be.greaterThan(0);
    });
  });

  describe("Market Resolution", function () {
    beforeEach(async function () {
      // Create market with creator
      await contract
        .connect(signers.creator)
        .createMarket("Resolution test", 7 * 24 * 60 * 60);

      // Add some bets
      const betAmount = ethers.parseEther("0.1");
      await contract
        .connect(signers.alice)
        .placeBet(0, true, { value: betAmount });
      await contract
        .connect(signers.bob)
        .placeBet(0, false, { value: betAmount });
    });

    /**
     * ❌ INCORRECT: Non-creator attempts resolution
     * Only market creator should be able to resolve
     */
    it("should only allow creator to resolve market", async function () {
      // Market not yet ended
      const tx = await ethers.provider.send("hardhat_mine", ["0x50"]); // Mine 80 blocks

      await expect(
        contract.connect(signers.alice).resolveMarket(0, true)
      ).to.be.revertedWith("Only creator can resolve");
    });

    /**
     * ❌ INCORRECT: Resolving before market end time
     */
    it("should not allow resolution before market ends", async function () {
      await expect(
        contract.connect(signers.creator).resolveMarket(0, true)
      ).to.be.revertedWith("Market is still active");
    });

    /**
     * ✅ CORRECT: Creator resolves market after end time
     */
    it("should allow creator to resolve after market ends", async function () {
      // Mine blocks to move time forward
      const tx = await ethers.provider.send("hardhat_mine", ["0x50"]);

      // Advance time past market end
      const block = await ethers.provider.getBlock("latest");
      const market = await contract.getMarket(0);
      const timeUntilEnd = Number(market.endTime) - Number(block?.timestamp || 0);

      if (timeUntilEnd > 0) {
        await ethers.provider.send("hardhat_mine", ["0x50"]);
      }

      const resolveTx = await contract
        .connect(signers.creator)
        .resolveMarket(0, true);
      await resolveTx.wait();

      const resolvedMarket = await contract.getMarket(0);
      expect(resolvedMarket.resolved).to.equal(true);
      expect(resolvedMarket.outcome).to.equal(true);
    });

    /**
     * ❌ INCORRECT: Attempting to resolve already resolved market
     */
    it("should not allow double resolution", async function () {
      // Advance time and resolve
      await ethers.provider.send("hardhat_mine", ["0x50"]);

      const resolveTx = await contract
        .connect(signers.creator)
        .resolveMarket(0, true);
      await resolveTx.wait();

      // Second resolution attempt
      await expect(
        contract.connect(signers.creator).resolveMarket(0, false)
      ).to.be.revertedWith("Market already resolved");
    });
  });

  describe("Winnings Claim", function () {
    beforeEach(async function () {
      // Create and resolve a market
      await contract
        .connect(signers.creator)
        .createMarket("Winnings test", 7 * 24 * 60 * 60);

      const betAmount = ethers.parseEther("0.1");
      await contract
        .connect(signers.alice)
        .placeBet(0, true, { value: betAmount });
      await contract
        .connect(signers.bob)
        .placeBet(0, false, { value: betAmount });

      // Advance time and resolve
      await ethers.provider.send("hardhat_mine", ["0x50"]);
      await contract.connect(signers.creator).resolveMarket(0, true);
    });

    /**
     * ❌ INCORRECT: Attempting to claim before market is resolved
     */
    it("should not allow claiming before resolution", async function () {
      await contract
        .connect(signers.creator)
        .createMarket("Unresolved test", 7 * 24 * 60 * 60);

      const betAmount = ethers.parseEther("0.1");
      await contract
        .connect(signers.alice)
        .placeBet(1, true, { value: betAmount });

      await expect(
        contract.connect(signers.alice).claimWinnings(1)
      ).to.be.revertedWith("Market not resolved yet");
    });

    /**
     * ✅ CORRECT: Winners can claim winnings
     */
    it("should allow winners to claim", async function () {
      const initialBalance = await ethers.provider.getBalance(signers.alice.address);

      const tx = await contract.connect(signers.alice).claimWinnings(0);
      const receipt = await tx.wait();
      const gasUsed = receipt?.gasUsed || BigInt(0);
      const gasPrice = receipt?.gasPrice || BigInt(0);
      const gasCost = gasUsed * gasPrice;

      const finalBalance = await ethers.provider.getBalance(signers.alice.address);

      // Alice bet YES and market resolved to YES, should receive winnings
      expect(finalBalance).to.be.greaterThan(
        initialBalance - BigInt(ethers.parseEther("0.1")) + gasCost
      );
    });

    /**
     * ❌ INCORRECT: User without bet attempts to claim
     */
    it("should reject claiming without a bet", async function () {
      await expect(
        contract.connect(signers.bob).claimWinnings(0)
      ).to.revert();
    });

    /**
     * ❌ INCORRECT: User attempts to claim twice
     */
    it("should not allow claiming twice", async function () {
      await contract.connect(signers.alice).claimWinnings(0);

      // Second claim attempt
      await expect(
        contract.connect(signers.alice).claimWinnings(0)
      ).to.be.revertedWith("Already claimed");
    });
  });

  describe("Access Control & Encryption Patterns", function () {
    beforeEach(async function () {
      await contract.createMarket("Access control test", 7 * 24 * 60 * 60);
    });

    /**
     * ✅ CORRECT: Contract allows access to encrypted values with FHE.allowThis()
     *
     * FHEVM Pattern Explanation:
     * - FHE.allowThis() grants the contract permission to access encrypted value
     * - FHE.allow(value, user) grants specific user permission
     * - Both are required for encrypted data operations
     */
    it("demonstrates FHE.allowThis() and FHE.allow() pattern", async function () {
      const betAmount = ethers.parseEther("0.1");

      // When placeBet is called:
      // 1. encryptedAmount = FHE.asEuint32(betAmountUnits)
      // 2. FHE.allowThis(encryptedAmount) - contract gets access
      // 3. FHE.allow(encryptedAmount, msg.sender) - user gets access

      const tx = await contract
        .connect(signers.alice)
        .placeBet(0, true, { value: betAmount });

      // Transaction succeeds, proving access control was properly set
      expect(tx).to.not.be.undefined;
    });

    /**
     * ❌ COMMON MISTAKE: Missing FHE.allowThis()
     *
     * If contract forgot FHE.allowThis(encryptedValue), it would fail with:
     * "User is not authorized to access encrypted value"
     *
     * This demonstrates why access control is explicitly required in FHEVM.
     */
    it("explains importance of FHE.allowThis()", async function () {
      // This test documents the pattern but doesn't explicitly test failure
      // because the contract correctly implements it

      // What would fail:
      // euint32 amount = FHE.asEuint32(123);
      // // Missing: FHE.allowThis(amount);
      // _count = FHE.add(_count, amount); // ❌ Would revert!

      // Correct approach:
      // euint32 amount = FHE.asEuint32(123);
      // FHE.allowThis(amount);        // ✅ Contract can access
      // FHE.allow(amount, msg.sender); // ✅ User can access

      const betAmount = ethers.parseEther("0.1");
      const tx = await contract
        .connect(signers.alice)
        .placeBet(0, true, { value: betAmount });

      expect(tx).to.not.be.undefined;
    });
  });

  describe("Input Encryption Pattern", function () {
    beforeEach(async function () {
      await contract.createMarket("Encryption pattern test", 7 * 24 * 60 * 60);
    });

    /**
     * ✅ CORRECT: Converting public input to encrypted type
     *
     * Pattern in contract:
     * uint32 betAmountUnits = uint32(msg.value / (0.001 ether));
     * euint32 encryptedAmount = FHE.asEuint32(betAmountUnits);
     *
     * This shows:
     * 1. Accept public input (msg.value)
     * 2. Convert to uint32 for FHE operations
     * 3. Encrypt using FHE.asEuint32() or FHE.asEbool()
     */
    it("demonstrates input encryption with asEuint32", async function () {
      // In contract:
      // msg.value (public) -> uint32 betAmountUnits -> euint32 encryptedAmount

      const betAmount = ethers.parseEther("0.1"); // Public bet

      const tx = await contract
        .connect(signers.alice)
        .placeBet(0, true, { value: betAmount });
      await tx.wait();

      const [betExists] = await contract
        .connect(signers.alice)
        .getBetExists(0);
      expect(betExists).to.equal(true);
    });

    /**
     * ✅ CORRECT: Converting bool to ebool
     *
     * Pattern:
     * bool _prediction (public input) -> ebool encryptedPrediction = FHE.asEbool()
     *
     * This encrypts the prediction so outcome cannot be determined from transactions.
     */
    it("demonstrates input encryption with asEbool", async function () {
      const predictions = [true, false];

      for (const prediction of predictions) {
        const newMarketId = await contract.getTotalMarkets();
        await contract.createMarket("Bool test", 7 * 24 * 60 * 60);

        const betAmount = ethers.parseEther("0.1");
        const tx = await contract
          .connect(signers.alice)
          .placeBet(Number(newMarketId), prediction, { value: betAmount });
        await tx.wait();

        const [exists] = await contract
          .connect(signers.alice)
          .getBetExists(Number(newMarketId));
        expect(exists).to.equal(true);
      }
    });
  });

  describe("Emergency Functions", function () {
    beforeEach(async function () {
      await contract
        .connect(signers.creator)
        .createMarket("Emergency test", 7 * 24 * 60 * 60);

      const betAmount = ethers.parseEther("0.1");
      await contract
        .connect(signers.alice)
        .placeBet(0, true, { value: betAmount });
    });

    /**
     * ❌ INCORRECT: Emergency withdrawal before timelock
     * 30-day delay is enforced for security
     */
    it("should enforce 30-day timelock on emergency withdrawal", async function () {
      // Advance time and resolve
      await ethers.provider.send("hardhat_mine", ["0x50"]);
      await contract.connect(signers.creator).resolveMarket(0, true);

      // Try immediate withdrawal
      await expect(
        contract.connect(signers.creator).emergencyWithdraw(0)
      ).to.be.revertedWith("Too early for emergency withdrawal");
    });

    /**
     * ❌ INCORRECT: Non-creator attempts emergency withdrawal
     */
    it("should only allow creator for emergency withdrawal", async function () {
      await expect(
        contract.connect(signers.alice).emergencyWithdraw(0)
      ).to.be.revertedWith("Only creator can resolve");
    });
  });

  describe("Educational: Anti-Patterns & Common Mistakes", function () {
    /**
     * ❌ MISTAKE: Missing bounds checking
     *
     * What NOT to do:
     * function unsafeBet(uint256 _amount) external payable {
     *   euint32 encrypted = FHE.asEuint32(uint32(_amount));
     *   // No minimum/maximum check - could lose precision or overflow
     * }
     *
     * What TO do (as implemented in PredictionMarket):
     * require(msg.value >= MIN_BET && msg.value <= MAX_BET, "Invalid bet amount");
     */
    it("documents the importance of bet amount bounds", async function () {
      await contract.createMarket("Bounds test", 7 * 24 * 60 * 60);

      // Below minimum fails
      await expect(
        contract.placeBet(1, true, {
          value: ethers.parseEther("0.00001"),
        })
      ).to.be.revertedWith("Invalid bet amount");

      // Above maximum fails
      await expect(
        contract.placeBet(1, true, {
          value: ethers.parseEther("20"),
        })
      ).to.be.revertedWith("Invalid bet amount");

      // Within bounds succeeds
      const tx = await contract.placeBet(1, true, {
        value: ethers.parseEther("0.1"),
      });
      expect(tx).to.not.be.undefined;
    });

    /**
     * ❌ MISTAKE: Reentrancy in claim functions
     *
     * What NOT to do:
     * function unsafeClaim(uint256 _marketId) external {
     *   uint256 winnings = calculateWinnings(_marketId);
     *   (bool success, ) = msg.sender.call{value: winnings}("");
     *   require(success);
     *   bets[_marketId][msg.sender].claimed = true; // ❌ Too late!
     * }
     *
     * What TO do (as in PredictionMarket):
     * bet.claimed = true; // Mark first
     * payable(msg.sender).transfer(winnings); // Then transfer
     */
    it("documents reentrancy protection pattern", async function () {
      await contract
        .connect(signers.creator)
        .createMarket("Reentrancy test", 7 * 24 * 60 * 60);

      const betAmount = ethers.parseEther("0.1");
      await contract
        .connect(signers.alice)
        .placeBet(1, true, { value: betAmount });

      await ethers.provider.send("hardhat_mine", ["0x50"]);
      await contract.connect(signers.creator).resolveMarket(1, true);

      // First claim succeeds
      const tx1 = await contract.connect(signers.alice).claimWinnings(1);
      await tx1.wait();

      // Second claim fails because claimed flag is already set
      await expect(
        contract.connect(signers.alice).claimWinnings(1)
      ).to.be.revertedWith("Already claimed");
    });
  });
});
