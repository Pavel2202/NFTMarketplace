const { assert, expect } = require("chai");
const { getNamedAccounts, deployments, ethers, network } = require("hardhat");
const {
  developmentChains,
  networkConfig,
} = require("../../helper-hardhat-config");

!developmentChains.includes(network.name)
  ? describe.skip
  : describe("NftMarketplace", function () {
      let nftMarketplace;
      const chainId = network.config.chainId;

      beforeEach(async function () {
        deployer = (await getNamedAccounts()).deployer;
        await deployments.fixture(["all"]);
        nftMarketplace = await ethers.getContract("NftMarketplace", deployer);
      });

      describe("listItem", function() {
        it("Should revert if the item is already listed", async function() {
            await nftMarketplace.listItem()
            await expect(nftMarketplace)
        })
      })
    });
