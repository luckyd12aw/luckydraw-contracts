// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Lucky is ERC721("Lucky Draw", "LUK"), Ownable(msg.sender) {
    struct Metadata {
        uint256 price;
        uint256 startTime;
        uint256 endTime;
        uint256 annTime;
        address winner;
        address[] candidates;
    }

    mapping(uint256 tokenId => Metadata) public metadataOf;
    uint256 public tokenIdLength;

    constructor() {}

    // Owner Functions

    function submit(uint256 _annTime) external onlyOwner {
        require(_annTime > block.number, "Invalid Time.");

        uint256 _tokenId = tokenIdLength++;
        Metadata storage meta = metadataOf[_tokenId];
        meta.price = 0.001 ether;
        meta.startTime = block.number;
        meta.annTime = _annTime;

        _mint(address(this), _tokenId);
    }

    function luckyDraw(uint256 tokenId) external onlyOwner {
        require(tokenId < tokenIdLength, "Invalid TokenId.");

        Metadata storage meta = metadataOf[tokenId];
        require(meta.winner == address(0), "Invalid Winner.");
        meta.endTime = block.number;

        require(meta.candidates.length != 0, "Invalid Candidates.");
        meta.winner = meta.candidates[
            // TODO: random
            uint256(blockhash(block.number - 1) | bytes32(block.timestamp)) %
                meta.candidates.length
        ];

        (bool success, ) = owner().call{value: address(this).balance}("");
        require(success, "Invalid Call.");
    }

    function emergencyWithdraw() external onlyOwner {
        (bool success, ) = msg.sender.call{value: address(this).balance}("");
        require(success, "Invalid Call.");
    }

    // User Functions

    function buy(uint256 tokenId) external payable {
        require(tokenId < tokenIdLength, "Invalid TokenId.");

        Metadata storage meta = metadataOf[tokenId];
        require(msg.value == meta.price, "Invalid Amounts.");

        meta.candidates.push(msg.sender);
    }

    function reward(uint256 tokenId) external {
        require(tokenId < tokenIdLength, "Invalid TokenId.");

        Metadata storage meta = metadataOf[tokenId];
        require(meta.annTime <= block.number, "Invalid Time.");
        require(meta.winner != address(0), "Invalid Winner.");

        // _mint(meta.winner, tokenId);
        _safeTransfer(address(this), meta.winner, tokenId);
    }

    // View Functions

    function allTokens() external view returns (Metadata[] memory metas) {
        metas = new Metadata[](tokenIdLength);
        for (uint256 i = 0; i < tokenIdLength; i++) {
            Metadata memory meta = metadataOf[i];
            metas[i].price = meta.price;
            metas[i].startTime = meta.startTime;
            metas[i].endTime = meta.endTime;
            metas[i].annTime = meta.annTime;
            metas[i].winner = meta.winner;
        }
    }
}
