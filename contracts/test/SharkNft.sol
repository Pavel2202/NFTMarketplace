// SPDX-License-Identifier: MIT

pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract SharkNft is ERC721 {
    uint256 private tokenCounter;

    event SharkMinted(uint256 indexed tokenId);

    constructor() ERC721("Shark", "SHARK") {
        tokenCounter = 0;
    }

    function mint() external {
        _safeMint(msg.sender, tokenCounter);
        emit SharkMinted(tokenCounter);
        tokenCounter++;
    }

    function getTokenCounter() external view returns (uint256) {
        return tokenCounter;
    }
}