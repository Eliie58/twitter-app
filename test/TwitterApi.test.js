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
