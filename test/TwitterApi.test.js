const { expect } = require("chai");
const { ethers } = require("hardhat");
require("chai").should();

describe("TwitterApi contract", () => {
  let TwitterApi;
  let twitterApi;

  beforeEach(async () => {
    TwitterApi = await ethers.getContractFactory("TwitterApiImpl");

    twitterApi = await TwitterApi.deploy();
  });

  function getDefaultTweetsList(numberOfTweets) {
    const tweetTexts = [];

    for (let i = 0; i < numberOfTweets; ++i) {
      tweetTexts.push("Tweet number " + i);
    }

    return tweetTexts;
  }

  function checkTweetTexts(tweetTextsExpected, tweetsActual, numberOfTweets) {
    const numberOfTweetsActual = tweetsActual.length;
    const numberOfTweetsExpected = tweetTextsExpected.length;

    expect(numberOfTweets).to.equal(numberOfTweetsExpected);
    expect(numberOfTweets).to.lessThanOrEqual(numberOfTweetsActual);

    for (let i = 0; i < numberOfTweets; ++i) {
      const reverseIndex = numberOfTweets - 1 - i;
      expect(tweetsActual[i].text).to.equal(tweetTextsExpected[reverseIndex]);
      expect(tweetsActual[i].deleted).to.equal(false);
    }
  }

  it("should create a tweet", async () => {
    const tweetText = "First tweet";
    const lastId = 2;

    await twitterApi.addTweet(tweetText);
    const tweets = await twitterApi.getTweets(lastId);

    expect(tweets[0].text).to.equal(tweetText);
    expect(tweets[0].deleted).to.equal(false);
  });

  it("should create a tweet and update by owner and not update by antoher user", async () => {
    const tweetText = "First tweet";
    const tweetTextNew1 = "New tweet text 1";
    const tweetTextNew2 = "New tweet text 2";

    const addresses = await ethers.getSigners();
    const addr1 = addresses[0];
    const addr2 = addresses[1];

    await twitterApi.connect(addr1).addTweet(tweetText);

    await twitterApi.connect(addr1).updateTweet(0, tweetTextNew1);

    await twitterApi
      .connect(addr2)
      .updateTweet(0, tweetTextNew2)
      .should.be.revertedWith("Only owner can take action");

    const tweets = await twitterApi.connect(addr1).getTweets(-1);

    expect(tweets[0].text).to.equal(tweetTextNew1);
    expect(tweets[0].text).to.not.equal(tweetTextNew2);
    expect(tweets[0].deleted).to.equal(false);
  });

  it("should create many tweets", async () => {
    const numberOfTweets = 3;
    const tweetTextsExpected = getDefaultTweetsList(numberOfTweets);

    for (let i = 0; i < numberOfTweets; ++i) {
      twitterApi.addTweet(tweetTextsExpected[i]);
    }

    const lastId = numberOfTweets + 1;
    const tweetsActual = await twitterApi.getTweets(lastId);

    checkTweetTexts(tweetTextsExpected, tweetsActual, numberOfTweets);
  });
});
