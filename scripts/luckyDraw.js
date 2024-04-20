const { ethers } = require("hardhat");

async function main() {
    // Get the contract to deploy
    const lucky = await ethers.getContractAt("Lucky", "0x0CFADaB77eC10CB761E11ed15E99d1e117B25769");
    console.log(await lucky.tokenIdLength());
    console.log(await ethers.provider.getBlockNumber());

    // Draw
    const tokenId = 0;
    console.log(await lucky.metadataOf(tokenId));
    const tx = await lucky.luckyDraw(tokenId);
    await tx.wait();
    console.log("Lucky Draw at:", tx.hash);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
