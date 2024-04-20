const { ethers } = require("hardhat");

async function main() {
    // Get the contract to deploy
    const lucky = await ethers.getContractAt("Lucky", "0x898b64943D01f2739C4B4cFAD4E16579C3228C35");
    console.log(await lucky.tokenIdLength());
    console.log(await ethers.provider.getBlockNumber());

    // Draw
    const tokenId = 3;
    console.log(await lucky.metadataOf(tokenId));

    const tx = await lucky.luckyDraw(tokenId);
    await tx.wait();
    console.log("Lucky Draw at:", tx.hash);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
