const { assert, expect } = require("chai");
const { getNamedAccounts, deployments, ethers, waffle } = require("hardhat");

describe("NftMarketplace", function () {
  let provider, nftMarketplace, sharkNft, alice, aliceSigner, bob, bobSigner;

  beforeEach(async function () {
    provider = waffle.provider;
    deployer = (await getNamedAccounts()).deployer;
    alice = (await getNamedAccounts()).alice;
    aliceSigner = await ethers.getSigner(alice);
    bob = (await getNamedAccounts()).bob;
    bobSigner = await ethers.getSigner(bob);
    await deployments.fixture(["all"]);
    nftMarketplace = await ethers.getContract("NftMarketplace", deployer);
    sharkNft = await ethers.getContract("SharkNft", deployer);
    await sharkNft.connect(aliceSigner).mint();
  });

  describe("listItem", function () {
    it("Should revert if the item is already listed", async function () {
      await sharkNft.connect(aliceSigner).approve(nftMarketplace.address, 0);
      await nftMarketplace
        .connect(aliceSigner)
        .listItem(sharkNft.address, 0, 100);
      await expect(
        nftMarketplace.connect(aliceSigner).listItem(sharkNft.address, 0, 100)
      ).to.be.revertedWith("NftMarketplace__AlreadyListed");
    });

    it("Should revert if not owner of the nft", async function () {
      await expect(
        nftMarketplace.connect(bobSigner).listItem(sharkNft.address, 0, 100)
      ).to.be.revertedWith("NftMarketplace__NotOwner");
    });

    it("Should revert if price is zero", async function () {
      await sharkNft.connect(aliceSigner).approve(nftMarketplace.address, 0);
      await expect(
        nftMarketplace.connect(aliceSigner).listItem(sharkNft.address, 0, 0)
      ).to.be.revertedWith("NftMarketplace__PriceMustBeAboveZero");
    });

    it("Should revert if marketplace is not approved", async function () {
      await expect(
        nftMarketplace.connect(aliceSigner).listItem(sharkNft.address, 0, 100)
      ).to.be.revertedWith("NftMarketplace__NotApprovedForMarketplace");
    });

    it("Successfully lists nft", async function () {
      await sharkNft.connect(aliceSigner).approve(nftMarketplace.address, 0);
      await expect(
        nftMarketplace.connect(aliceSigner).listItem(sharkNft.address, 0, 100)
      )
        .to.emit(nftMarketplace, "ItemListed")
        .withArgs(alice, sharkNft.address, 0, 100);
      let listedNft = await nftMarketplace.getListing(sharkNft.address, 0);
      assert.equal(listedNft.price, 100);
      assert.equal(listedNft.seller, alice);
    });
  });

  describe("buyItem", function () {
    it("Should revert if item is not listed", async function () {
      await expect(
        nftMarketplace.connect(bobSigner).buyItem(sharkNft.address, 2)
      ).to.be.revertedWith("NftMarketplace__NotListed");
    });

    it("Should revert if msg.value is lower than the nft price", async function () {
      await sharkNft.connect(aliceSigner).approve(nftMarketplace.address, 0);
      await nftMarketplace
        .connect(aliceSigner)
        .listItem(sharkNft.address, 0, 100);
      await expect(
        nftMarketplace
          .connect(bobSigner)
          .buyItem(sharkNft.address, 0, { value: 99 })
      ).to.be.revertedWith("NftMarketplace__PriceNotMet");
    });

    it("Successfully buys nft", async function () {
      await sharkNft.connect(aliceSigner).approve(nftMarketplace.address, 0);
      await nftMarketplace
        .connect(aliceSigner)
        .listItem(sharkNft.address, 0, 100);
      await expect(
        nftMarketplace
          .connect(bobSigner)
          .buyItem(sharkNft.address, 0, { value: 100 })
      )
        .to.emit(nftMarketplace, "ItemBought")
        .withArgs(bob, sharkNft.address, 0, 100);

      let proceeds = await nftMarketplace.getProceeds(alice);
      assert.equal(proceeds, 100);

      let listing = await nftMarketplace.getListing(sharkNft.address, 0);
      assert.equal(listing.price, 0);
      assert.equal(
        listing.seller,
        "0x0000000000000000000000000000000000000000"
      );

      let tokenOwner = await sharkNft.ownerOf(0);
      assert.equal(tokenOwner, bob);
    });
  });

  describe("cancelListing", function () {
    it("Should revert if not owner", async function () {
      await expect(
        nftMarketplace.connect(bobSigner).cancelListing(sharkNft.address, 0)
      ).to.be.revertedWith("NftMarketplace__NotOwner");
    });

    it("Should revert if not listed", async function () {
      await expect(
        nftMarketplace.connect(aliceSigner).cancelListing(sharkNft.address, 0)
      ).to.be.revertedWith("NftMarketplace__NotListed");
    });

    it("Successfully cancels listing", async function () {
      await sharkNft.connect(aliceSigner).approve(nftMarketplace.address, 0);
      await nftMarketplace
        .connect(aliceSigner)
        .listItem(sharkNft.address, 0, 100);
      await expect(
        nftMarketplace.connect(aliceSigner).cancelListing(sharkNft.address, 0)
      )
        .to.emit(nftMarketplace, "ItemCanceled")
        .withArgs(alice, sharkNft.address, 0);
      let listing = await nftMarketplace.getListing(sharkNft.address, 0);
      assert.equal(listing.price, 0);
      assert.equal(
        listing.seller,
        "0x0000000000000000000000000000000000000000"
      );
    });
  });

  describe("updateListing", function () {
    it("Should revert if not owner", async function () {
      await expect(
        nftMarketplace
          .connect(bobSigner)
          .updateListing(sharkNft.address, 0, 200)
      ).to.be.revertedWith("NftMarketplace__NotOwner");
    });

    it("Should revert if not listed", async function () {
      await expect(
        nftMarketplace
          .connect(aliceSigner)
          .updateListing(sharkNft.address, 0, 200)
      ).to.be.revertedWith("NftMarketplace__NotListed");
    });

    it("Should revert if new price is zero", async function () {
      await sharkNft.connect(aliceSigner).approve(nftMarketplace.address, 0);
      await nftMarketplace
        .connect(aliceSigner)
        .listItem(sharkNft.address, 0, 100);
      await expect(
        nftMarketplace
          .connect(aliceSigner)
          .updateListing(sharkNft.address, 0, 0)
      ).to.be.revertedWith("NftMarketplace__PriceMustBeAboveZero");
    });

    it("Successfullt updates price", async function () {
      await sharkNft.connect(aliceSigner).approve(nftMarketplace.address, 0);
      await nftMarketplace
        .connect(aliceSigner)
        .listItem(sharkNft.address, 0, 100);
      await expect(
        nftMarketplace
          .connect(aliceSigner)
          .updateListing(sharkNft.address, 0, 200)
      )
        .to.emit(nftMarketplace, "ItemListed")
        .withArgs(alice, sharkNft.address, 0, 200);
      let listing = await nftMarketplace.getListing(sharkNft.address, 0);
      assert.equal(listing.price, 200);
    });
  });

  describe("withdrawProceeds", function () {
    it("Should revert if proceeds are zero", async function () {
      await sharkNft.connect(aliceSigner).approve(nftMarketplace.address, 0);
      await nftMarketplace
        .connect(aliceSigner)
        .listItem(sharkNft.address, 0, 100);
      await expect(
        nftMarketplace.connect(aliceSigner).withdrawProceeds()
      ).to.be.revertedWith("NftMarketplace__NoProceeds");
    });

    it("Successfully emits event", async function () {
      await sharkNft.connect(aliceSigner).approve(nftMarketplace.address, 0);
      await nftMarketplace
        .connect(aliceSigner)
        .listItem(sharkNft.address, 0, 100);

      await nftMarketplace
        .connect(bobSigner)
        .buyItem(sharkNft.address, 0, { value: 100 });

      await expect(
        nftMarketplace.connect(aliceSigner).withdrawProceeds()
      ).to.emit(nftMarketplace, "ProceedsWithdrawn");
    });

    it("Successfully pays proceedings", async function () {
      await sharkNft.connect(aliceSigner).approve(nftMarketplace.address, 0);
      await nftMarketplace
        .connect(aliceSigner)
        .listItem(sharkNft.address, 0, 100);
      await nftMarketplace
        .connect(bobSigner)
        .buyItem(sharkNft.address, 0, { value: 100 });

      const aliceProceedsBefore = await nftMarketplace.getProceeds(alice);
      const aliceBalanceBefore = await provider.getBalance(alice);
      const txResponse = await nftMarketplace.connect(aliceSigner).withdrawProceeds();
      const transactionReceipt = await txResponse.wait(1);
      const { gasUsed, effectiveGasPrice } = transactionReceipt;
      const gasCost = gasUsed.mul(effectiveGasPrice);
      const aliceBalanceAfter = await provider.getBalance(alice);

      assert(
        aliceBalanceAfter.add(gasCost).toString() ==
        aliceProceedsBefore.add(aliceBalanceBefore).toString()
      );
    });
  });
});
