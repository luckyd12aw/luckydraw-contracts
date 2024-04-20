const { ethers } = require("hardhat");

async function main() {
    // Get the contract to deploy
    const lucky = await ethers.getContractAt("Lucky", "0x898b64943D01f2739C4B4cFAD4E16579C3228C35");

    // Submit
    const bn = await ethers.provider.getBlockNumber();
    const tx = await lucky.submit(bn + 1000000, bn + 2000000);
    await tx.wait();
    console.log("Lucky Draw new NFT submitted at:", tx.hash);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
