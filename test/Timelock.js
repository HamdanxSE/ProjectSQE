const { expect } = require("chai");
const { time, loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");

describe("TimeLock Contract", function () {

  // Helper function to deploy the contract with the specified unlock time
  async function deployOneYearLockFixture() {
    const ONE_YEAR_IN_SECS = 365 * 24 * 60 * 60;
    const ONE_GWEI = 1_000_000_000;

    const lockedAmount = ONE_GWEI;
    const unlockTime = (await time.latest()) + ONE_YEAR_IN_SECS;

    const [owner, otherAccount] = await ethers.getSigners();

    const TimeLock = await ethers.getContractFactory("TimeLock");
    const timeLock = await TimeLock.deploy(unlockTime, { value: lockedAmount });

    return { timeLock, unlockTime, lockedAmount, owner, otherAccount };
  }

  // *************** Equivalence Class Partitioning (ECP) Tests ***************
  describe("Equivalence Class Partitioning (ECP)", function () {
    it("Should set the right unlockTime", async function () {
      // **Technique**: Equivalence Class Partitioning (ECP)
      // Verifying that the unlock time is set correctly during deployment
      const { timeLock, unlockTime } = await loadFixture(deployOneYearLockFixture);
      expect(await timeLock.unlockTime()).to.equal(unlockTime);
    });

    it("Should set the right owner", async function () {
      // **Technique**: Equivalence Class Partitioning (ECP)
      // Verifying that the deployer is set as the owner
      const { timeLock, owner } = await loadFixture(deployOneYearLockFixture);
      expect(await timeLock.owner()).to.equal(owner.address);
    });

    it("Should allow the owner to withdraw after unlockTime", async function () {
      // **Technique**: Equivalence Class Partitioning (ECP)
      // Verifying that the owner can withdraw funds once the unlockTime has passed
      const { timeLock, unlockTime } = await loadFixture(deployOneYearLockFixture);
      await time.increaseTo(unlockTime); // Simulating unlockTime arrival
      await expect(timeLock.withdraw()).not.to.be.reverted;
    });
  });

  // *************** Boundary Value Analysis (BVA) Tests ***************
  describe("Boundary Value Analysis (BVA)", function () {
    it("Should fail if unlockTime is not in the future", async function () {
      // **Technique**: Boundary Value Analysis (BVA)
      // Testing the scenario where unlockTime is set to the current time or in the past
      const latestTime = await time.latest();
      const TimeLock = await ethers.getContractFactory("TimeLock");
      await expect(TimeLock.deploy(latestTime, { value: 1 })).to.be.revertedWith("Unlock time should be in the future");
    });

    it("Should revert if withdrawal is attempted before unlockTime", async function () {
      // **Technique**: Boundary Value Analysis (BVA)
      // Verifying that withdrawal is not allowed before unlockTime
      const { timeLock } = await loadFixture(deployOneYearLockFixture);
      await expect(timeLock.withdraw()).to.be.revertedWith("You can't withdraw yet");
    });

    it("Should revert if called by non-owner", async function () {
      // **Technique**: Boundary Value Analysis (BVA)
      // Verifying that non-owner accounts cannot withdraw funds
      const { timeLock, unlockTime, otherAccount } = await loadFixture(deployOneYearLockFixture);
      await time.increaseTo(unlockTime); // Fast forward time to unlockTime
      await expect(timeLock.connect(otherAccount).withdraw()).to.be.revertedWith("You aren't the owner");
    });
  });

  // *************** Error Guessing (EG) Tests ***************
  describe("Error Guessing (EG)", function () {
    it("Should fail if unlockTime is not in the future", async function () {
      // **Technique**: Error Guessing (EG)
      // Guessing that invalid input (i.e., unlockTime in the past) will cause failure
      const latestTime = await time.latest();
      const TimeLock = await ethers.getContractFactory("TimeLock");
      await expect(TimeLock.deploy(latestTime, { value: 1 })).to.be.revertedWith("Unlock time should be in the future");
    });

    it("Should prevent multiple withdrawals", async function () {
      // **Technique**: Error Guessing (EG)
      // Verifying that multiple withdrawals are prevented after the first one
      const { timeLock, unlockTime } = await loadFixture(deployOneYearLockFixture);
      await time.increaseTo(unlockTime); // Simulate time passing to unlockTime
      await timeLock.withdraw(); // First withdrawal should succeed
      await expect(timeLock.withdraw()).to.be.revertedWith("Funds have already been withdrawn"); // Second attempt should fail
    });
  });

  // *************** Advanced Testing with Event Checking ***************
  describe("Event Emissions", function () {
    it("Should emit Withdrawal event on successful withdrawal", async function () {
      // **Technique**: Advanced Testing with Event Checking
      // Verifying that the `Withdrawal` event is emitted correctly with expected arguments
      const { timeLock, unlockTime, lockedAmount } = await loadFixture(deployOneYearLockFixture);
      await time.increaseTo(unlockTime); // Simulate time passing to unlockTime
      await expect(timeLock.withdraw())
        .to.emit(timeLock, "Withdrawal")
        .withArgs(lockedAmount, anyValue); // Accept any timestamp value for flexibility
    });
  });

  // *************** Advanced Time Simulation Tests ***************
  describe("Time Manipulation", function () {
    it("Should handle time manipulation correctly using Hardhat's time utilities", async function () {
      // **Technique**: Advanced Time Simulation
      // Verifying that the contract handles simulated time correctly with Hardhat's utilities
      const { timeLock, unlockTime } = await loadFixture(deployOneYearLockFixture);
      await time.increaseTo(unlockTime); // Simulate time passing to unlockTime
      await expect(timeLock.withdraw()).not.to.be.reverted; // Ensure withdrawal works after time manipulation
    });
  });

  // *************** Balance Change Verification Tests ***************
  describe("Balance Changes", function () {
    it("Should transfer funds to the owner on withdrawal", async function () {
      // **Technique**: Balance Change Verification
      // Verifying that funds are correctly transferred to the owner after withdrawal
      const { timeLock, unlockTime, lockedAmount, owner } = await loadFixture(deployOneYearLockFixture);
      await time.increaseTo(unlockTime); // Simulate time passing to unlockTime
      await expect(timeLock.withdraw()).to.changeEtherBalances([owner, timeLock], [lockedAmount, -lockedAmount]);
    });
  });
});
