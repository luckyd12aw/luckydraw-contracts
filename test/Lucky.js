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
      const tx = await lucky.connect(addr1).buy(0, { value: ethers.parseEther("0.001") });
      await tx.wait();
      const meta = await lucky.metadataOf(0);
      expect(meta.candidates.length).to.equal(1);
    });

    it("Should conduct a lucky draw correctly", async function () {
      const bn = await ethers.provider.getBlockNumber();
      await lucky.submit(bn + 1000, bn + 2000);
      await lucky.connect(addr1).buy(0, { value: ethers.parseEther("0.001") });
      await mine(2000);
      const tx = await lucky.connect(owner).luckyDraw(0);
      await tx.wait();
      const meta = await lucky.metadataOf(0);
      expect(meta.winner).to.not.equal(ethers.AddressZero);
    });

    it("Allows the owner to perform an emergency withdrawal", async function () {
      const tx = await lucky.connect(owner).emergencyWithdraw();
      await tx.wait();
      expect(await ethers.provider.getBalance(await lucky.getAddress())).to.equal(0);
    });
  });
});
