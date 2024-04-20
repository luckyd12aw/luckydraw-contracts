const { ethers } = require("hardhat");

async function main() {
  // Get the contract to deploy
  const Lucky = await hre.ethers.getContractFactory("Lucky");

  // Deploy the contract
  const lucky = await Lucky.deploy();
  await lucky.waitForDeployment();

  console.log("Lucky Draw deployed to:", await lucky.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
