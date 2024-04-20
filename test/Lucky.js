const { expect } = require("chai");
const { ethers } = require("hardhat");
const { mine } = require("@nomicfoundation/hardhat-network-helpers");

describe("Lucky Draw Contract", function () {
  let Lucky;
  let lucky;
  let owner;
  let addr1;
  let addr2;
  let addrs;

  beforeEach(async function () {
    // Get the ContractFactory and Signers here.
    Lucky = await ethers.getContractFactory("Lucky");
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

    // Deploy a new contract before each test.
    lucky = await Lucky.deploy();
  });

  describe("Deployment", async function () {
    it("Should set the right owner", async function () {
      expect(await lucky.owner()).to.equal(owner.address);
    });
  });

  describe("Transactions", async function () {
    it("Allows the owner to submit a new token", async function () {
      const bn = await ethers.provider.getBlockNumber();
      await lucky.submit(bn + 1000, bn + 2000);
      expect(await lucky.tokenIdLength()).to.equal(1);
    });

    it("Allows users to buy tickets", async function () {
      const bn = await ethers.provider.getBlockNumber();
      await lucky.submit(bn + 1000, bn + 2000);
      await lucky.connect(addr1).buy(0, { value: ethers.parseEther("0.001") });
      const meta = await lucky.metadataOf(0);
      expect(meta.candidates.length).to.equal(1);
    });

    it("Should conduct a lucky draw correctly", async function () {
      const bn = await ethers.provider.getBlockNumber();
      await lucky.submit(bn + 1000, bn + 2000);
      await lucky.connect(addr1).buy(0, { value: ethers.parseEther("0.001") });
      await mine(2000);
      await lucky.connect(owner).luckyDraw(0);
      const meta = await lucky.metadataOf(0);
      expect(meta.winner).to.not.equal(ethers.ZeroAddress);
    });

    it("Allows the owner to perform an emergency withdrawal", async function () {
      await lucky.connect(owner).emergencyWithdraw();
      expect(await ethers.provider.getBalance(await lucky.getAddress())).to.equal(0);
    });
  });

  describe("View Functions", function () {
    describe("metadataOf", function () {
      it("Returns correct metadata for an existing token", async function () {
        let bn = await ethers.provider.getBlockNumber();
        await lucky.submit(bn + 1000, bn + 2000);
        await lucky.connect(addr1).buy(0, { value: ethers.parseEther("0.001") });
        const meta = await lucky.metadataOf(0);

        expect(meta.price.toString()).to.equal(ethers.parseEther("0.001").toString());
        expect(meta.startTime).to.equal(bn + 1);
        expect(meta.endTime).to.equal(bn + 1000);
        expect(meta.annTime).to.equal(bn + 2000);
        expect(meta.winner).to.equal(ethers.ZeroAddress);
        expect(meta.candidates.length).to.equal(1);
      });

      it("Reverts for non-existent token", async function () {
        await expect(lucky.metadataOf(999)).to.be.revertedWith("Invalid TokenId.");
      });
    });

    describe("allMetadata", function () {
      it("Initially returns an empty array", async function () {
        const metas = await lucky.allMetadata();
        expect(metas.length).to.equal(0);
      });

      it("Returns an array with correct data after tokens are submitted", async function () {
        const bn = await ethers.provider.getBlockNumber();
        await lucky.submit(bn + 1000, bn + 2000);
        const metas = await lucky.allMetadata();

        expect(metas.length).to.equal(1);
        expect(metas[0].price.toString()).to.equal(ethers.parseEther("0.001").toString());
      });
    });
  });

  describe("Initial Conditions", function () {
    it("Initial tokenIdLength should be zero", async function () {
      expect(await lucky.tokenIdLength()).to.equal(0);
    });

    it("Metadata should not exist for non-existent token", async function () {
      await expect(lucky.metadataOf(0)).to.be.revertedWith("Invalid TokenId.");
    });
  });

  // Specific cases

  describe("Buy Function", function () {
    it("Should fail if buying after end time", async function () {
      const bn = await ethers.provider.getBlockNumber();
      await lucky.submit(bn + 10, bn + 20);  // Setting a short duration for testing
      await mine(11);  // Fast forward past the end time
      await expect(lucky.connect(addr1).buy(0, { value: ethers.parseEther("0.001") }))
        .to.be.revertedWith("Invalid Time.");
    });

    it("Should fail if incorrect payment amount", async function () {
      const bn = await ethers.provider.getBlockNumber();
      await lucky.submit(bn + 1000, bn + 2000);
      await expect(lucky.connect(addr1).buy(0, { value: ethers.parseEther("0.0001") }))
        .to.be.revertedWith("Invalid Amounts.");
    });
  });

  // Others

  describe("Ownable Tests", function () {
    it("Non-owner cannot call owner-only functions", async function () {
      const bn = await ethers.provider.getBlockNumber();
      await expect(lucky.connect(addr1).submit(bn + 1000, bn + 2000))
        .to.be.reverted;
    });

    it("Ownership can be transferred", async function () {
      await lucky.transferOwnership(addr1.address);
      expect(await lucky.owner()).to.equal(addr1.address);
      // Test new owner can call `onlyOwner` functions
      const bn = await ethers.provider.getBlockNumber();
      await expect(lucky.connect(addr1).submit(bn + 1000, bn + 2000))
        .not.to.be.reverted;
    });
  });

  describe("ERC721Enumerable Tests", function () {
    it("Should correctly report balanceOf", async function () {
      expect(await lucky.balanceOf(owner.address)).to.equal(0);
      const bn = await ethers.provider.getBlockNumber();
      await lucky.submit(bn + 1000, bn + 2000);
      await lucky.connect(addr1).buy(0, { value: ethers.parseEther("0.001") });
      await mine(2000);
      await lucky.connect(owner).luckyDraw(0);
      await lucky.reward(0);
      expect(await lucky.balanceOf(addr1.address)).to.equal(1);
    });
  });
});
