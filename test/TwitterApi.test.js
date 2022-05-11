const { expect } = require("chai");
const { ethers } = require("hardhat");
require("chai").should();

describe("TwitterApi contract", () => {
  let TwitterApi;
  // let user1;
  // let user2;
  let twitterApi;

  beforeEach(async () => {
    TwitterApi = await ethers.getContractFactory("TwitterApiImpl");

    twitterApi = await TwitterApi.deploy();
  });

  it("should create a tweet", async () => {
    const tweetText = "First tweet";
    const lastId = 2;

    await twitterApi.addTweet(tweetText);
    const tweets = await twitterApi.getTweets(lastId);

    expect(tweets[0].text).to.equal(tweetText);
    expect(tweets[0].deleted).to.equal(false);
  });
});
