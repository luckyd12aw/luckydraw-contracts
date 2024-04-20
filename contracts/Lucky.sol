// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "arbos-precompiles/arbos/builtin/ArbSys.sol";

contract Lucky is ERC721("Lucky Draw", "LUK"), Ownable(msg.sender) {
    struct Metadata {
        uint256 price;
        uint256 startTime;
        uint256 endTime;
        uint256 annTime;
        address winner;
        address[] candidates;
    }

    mapping(uint256 tokenId => Metadata) internal _metadataOf;
    uint256 public tokenIdLength;

    constructor() {}

    // Owner Functions

    function submit(uint256 _endTime, uint256 _annTime) external onlyOwner {
        uint256 blockNumber = ArbSys(address(100)).arbBlockNumber();
        require(_endTime > blockNumber, "Invalid Time.");
        require(_annTime >= _endTime, "Invalid Time.");

        uint256 _tokenId = tokenIdLength++;
        address[] memory cs;
        _metadataOf[_tokenId] = Metadata({
            price: 0.001 ether,
            startTime: blockNumber,
            endTime: _endTime,
            annTime: _annTime,
            winner: address(0),
            candidates: cs
        });

        _mint(address(this), _tokenId);
    }

    function luckyDraw(uint256 tokenId) external onlyOwner {
        uint256 blockNumber = ArbSys(address(100)).arbBlockNumber();
        require(tokenId < tokenIdLength, "Invalid TokenId.");

        Metadata storage meta = _metadataOf[tokenId];
        require(meta.annTime <= blockNumber, "Invalid Time.");
        require(meta.winner == address(0), "Invalid Winner.");
        require(meta.candidates.length > 0, "Invalid Candidates.");

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
        uint256 blockNumber = ArbSys(address(100)).arbBlockNumber();
        require(tokenId < tokenIdLength, "Invalid TokenId.");

        Metadata storage meta = _metadataOf[tokenId];
        require(meta.endTime >= blockNumber, "Invalid Time.");
        require(msg.value == meta.price, "Invalid Amounts.");

        meta.candidates.push(msg.sender);
    }

    function reward(uint256 tokenId) external {
        uint256 blockNumber = ArbSys(address(100)).arbBlockNumber();
        require(tokenId < tokenIdLength, "Invalid TokenId.");

        Metadata storage meta = _metadataOf[tokenId];
        require(meta.annTime <= blockNumber, "Invalid Time.");
        require(meta.winner != address(0), "Invalid Winner.");

        // _mint(meta.winner, tokenId);
        _safeTransfer(address(this), meta.winner, tokenId);
    }

    // View Functions

    function metadataOf(
        uint256 tokenId
    ) external view returns (Metadata memory meta) {
        require(tokenId < tokenIdLength, "Invalid TokenId.");

        return _metadataOf[tokenId];
    }

    function allMetadata() external view returns (Metadata[] memory metas) {
        metas = new Metadata[](tokenIdLength);
        for (uint256 i = 0; i < tokenIdLength; i++) {
            Metadata memory meta = _metadataOf[i];
            metas[i] = meta;
        }
    }
}
