const { ethers } = require("hardhat");

async function main() {
    // Get the contract to deploy
    const lucky = await ethers.getContractAt("Lucky", "0x0CFADaB77eC10CB761E11ed15E99d1e117B25769");

    // Submit
    const bn = await ethers.provider.getBlockNumber();
    const tx = await lucky.submit(bn + 10000, bn + 18000);
    await tx.wait();
    console.log("Lucky Draw new NFT submitted at:", tx.hash);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
