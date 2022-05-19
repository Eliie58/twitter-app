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

  it("should return empty tweet list", async () => {
    const tweets = await twitterApi.getTweets(-1);

    expect(tweets.length).to.equal(0);
  });

  it("should return small tweet list", async () => {
    const tweetText = "First tweet";

    const maxTweetIdToFind = 5;
    for (let i = 0; i < maxTweetIdToFind + 10; ++i) {
      await twitterApi.addTweet(tweetText);
    }

    const tweets = await twitterApi.getTweets(maxTweetIdToFind);

    let numberOfTweetsRead = 0;
    let maxTweetId = -1;
    for (let i = 0; i < tweets.length; ++i) {
      if (tweets[i].text === tweetText) {
        ++numberOfTweetsRead;
        maxTweetId = Math.max(maxTweetId, tweets[i].id);
      }
    }

    expect(maxTweetId).to.equal(maxTweetIdToFind);
    expect(numberOfTweetsRead).to.equal(maxTweetIdToFind + 1);
  });

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

  it("should create a tweet and update by owner", async () => {
    const tweetText = "First tweet";
    const tweetTextNew1 = "New tweet text 1";
    const tweetTextNew2 = "New tweet text 2";

    const addresses = await ethers.getSigners();
    const addr1 = addresses[0];
    await twitterApi.connect(addr1).addTweet(tweetText);

    await twitterApi.connect(addr1).updateTweet(0, tweetTextNew2);

    const tweets = await twitterApi.connect(addr1).getTweets(-1);

    expect(tweets[0].text).to.equal(tweetTextNew2);
    expect(tweets[0].text).to.not.equal(tweetTextNew1);
    expect(tweets[0].deleted).to.equal(false);
  });

  it("should create a tweet and not update by another user", async () => {
    const tweetText1 = "Tweet text 1";
    const tweetText2 = "New tweet text 2";

    const addresses = await ethers.getSigners();
    const addr1 = addresses[0];
    const addr2 = addresses[1];

    await twitterApi.connect(addr1).addTweet(tweetText1);
    await twitterApi
      .connect(addr2)
      .updateTweet(0, tweetText2)
      .should.be.revertedWith("Only owner can take action");

    const tweets = await twitterApi.connect(addr1).getTweets(-1);

    expect(tweets[0].text).to.equal(tweetText1);
    expect(tweets[0].text).to.not.equal(tweetText2);
    expect(tweets[0].deleted).to.equal(false);
  });

  it("should create a tweet and delete by owner", async () => {
    const tweetText1 = "First tweet";
    const tweetText2 = "Second tweet";

    const addresses = await ethers.getSigners();
    const addr1 = addresses[0];

    await twitterApi.connect(addr1).addTweet(tweetText1);
    await twitterApi.connect(addr1).addTweet(tweetText2);
    await twitterApi.connect(addr1).deleteTweet(0);

    const tweets = await twitterApi.getTweets(-1);

    expect(tweets[0].text).to.equal(tweetText2);
    expect(tweets[1].text).to.not.equal(tweetText1);
  });

  it("should create a tweet and retweet", async () => {
    const tweetText1 = "First tweet";

    const addresses = await ethers.getSigners();
    const addr1 = addresses[0];
    const addr2 = addresses[1];

    await twitterApi.connect(addr1).addTweet(tweetText1);
    await twitterApi.connect(addr2).retweet(0);

    const tweets = await twitterApi.getTweets(-1);

    expect(tweets[0].text).to.equal(tweetText1);
    expect(tweets[0].retweets.length).to.equal(1);
    expect(tweets[0].retweets[0]).to.equal(
      await twitterApi.connect(addr2).getMyAddress(),
    );
    expect(tweets[0].deleted).to.equal(false);
  });

  it("should create a tweet and many users retweet", async () => {
    const tweetText1 = "First tweet";
    const tweetText2 = "Second tweet";

    const addresses = await ethers.getSigners();
    const addr1 = addresses[0];
    const numberOdUsers1 = 5;
    const numberOdUsers2 = 7;

    await twitterApi.connect(addr1).addTweet(tweetText1);
    await twitterApi.connect(addr1).addTweet(tweetText2);

    for (let user = 0; user < numberOdUsers1; ++user) {
      await twitterApi.connect(addresses[user]).retweet(1);
    }

    for (let user = 0; user < numberOdUsers2; ++user) {
      await twitterApi.connect(addresses[user]).retweet(0);
    }

    const tweets = await twitterApi.getTweets(-1);

    for (let user = 0; user < numberOdUsers2; ++user) {
      expect(tweets[1].retweets[user]).to.equal(
        await twitterApi.connect(addresses[user]).getMyAddress(),
      );
    }

    for (let user = 0; user < numberOdUsers1; ++user) {
      expect(tweets[0].retweets[user]).to.equal(
        await twitterApi.connect(addresses[user]).getMyAddress(),
      );
    }

    expect(tweets[0].text).to.equal(tweetText2);
    expect(tweets[1].text).to.equal(tweetText1);
    expect(tweets[0].retweets.length).to.equal(numberOdUsers1);
    expect(tweets[1].retweets.length).to.equal(numberOdUsers2);
    expect(tweets[0].deleted).to.equal(false);
    expect(tweets[1].deleted).to.equal(false);
  });

  it("should create a tweet and many users like", async () => {
    const tweetText1 = "First tweet";
    const tweetText2 = "Second tweet";

    const addresses = await ethers.getSigners();
    const addr1 = addresses[0];
    const numberOdUsers1 = 5;
    const numberOdUsers2 = 7;

    await twitterApi.connect(addr1).addTweet(tweetText1);
    await twitterApi.connect(addr1).addTweet(tweetText2);

    for (let user = 0; user < numberOdUsers1; ++user) {
      await twitterApi.connect(addresses[user]).like(1);
    }

    for (let user = 0; user < numberOdUsers2; ++user) {
      await twitterApi.connect(addresses[user]).like(0);
    }

    const tweets = await twitterApi.getTweets(-1);

    for (let user = 0; user < numberOdUsers2; ++user) {
      expect(tweets[1].likes[user]).to.equal(
        await twitterApi.connect(addresses[user]).getMyAddress(),
      );
    }

    for (let user = 0; user < numberOdUsers1; ++user) {
      expect(tweets[0].likes[user]).to.equal(
        await twitterApi.connect(addresses[user]).getMyAddress(),
      );
    }

    expect(tweets[0].text).to.equal(tweetText2);
    expect(tweets[1].text).to.equal(tweetText1);
    expect(tweets[0].likes.length).to.equal(numberOdUsers1);
    expect(tweets[1].likes.length).to.equal(numberOdUsers2);
    expect(tweets[0].deleted).to.equal(false);
    expect(tweets[1].deleted).to.equal(false);
  });

  it("should have correct number of likes", async () => {
    const tweetText1 = "First tweet";

    const addresses = await ethers.getSigners();
    const addr1 = addresses[0];
    const numberOfUsers = 5;

    await twitterApi.connect(addr1).addTweet(tweetText1);

    let likeCount = 0;
    // numberOfUsers will like the tweet
    for (let user = 0; user < numberOfUsers; ++user) {
      await twitterApi.connect(addresses[user]).like(0);
      likeCount++;
    }

    // numberOfUsers with index even will unlike the tweet
    for (let user = 0; user < numberOfUsers; ++user) {
      if (user % 2 == 0) {
        await twitterApi.connect(addresses[user]).like(0);
        likeCount--;
      }
    }

    const tweets = await twitterApi.getTweets(-1);
    expect(tweets[0].likes.length).to.equal(likeCount);
  });

  it("should have correct number of retweets", async () => {
    const tweetText1 = "First tweet";

    const addresses = await ethers.getSigners();
    const addr1 = addresses[0];
    const numberOfUsers = 5;

    await twitterApi.connect(addr1).addTweet(tweetText1);

    let retweetCount = 0;
    // numberOfUsers will retweet the tweet
    for (let user = 0; user < numberOfUsers; ++user) {
      await twitterApi.connect(addresses[user]).retweet(0);
      retweetCount++;
    }

    // numberOfUsers with index even will unretweet the tweet
    for (let user = 0; user < numberOfUsers; ++user) {
      if (user % 2 == 0) {
        await twitterApi.connect(addresses[user]).retweet(0);
        retweetCount--;
      }
    }

    const tweets = await twitterApi.getTweets(-1);
    expect(tweets[0].retweets.length).to.equal(retweetCount);
  });

  it("should have correct number of retweets and likes", async () => {
    const tweetText1 = "First tweet";

    const addresses = await ethers.getSigners();
    const addr1 = addresses[0];
    const numberOfUsers = 5;

    await twitterApi.connect(addr1).addTweet(tweetText1);

    let likeCount = 0;
    let retweetCount = 0;
    // numberOfUsers will retweet the tweet
    for (let user = 0; user < numberOfUsers; ++user) {
      await twitterApi.connect(addresses[user]).like(0);
      await twitterApi.connect(addresses[user]).retweet(0);
      likeCount++;
      retweetCount++;
    }

    // numberOfUsers with index even will unretweet the tweet
    for (let user = 0; user < numberOfUsers; ++user) {
      if (user % 2 == 0) {
        await twitterApi.connect(addresses[user]).retweet(0);
        retweetCount--;
      } else {
        await twitterApi.connect(addresses[user]).like(0);
        likeCount--;
      }
    }

    const tweets = await twitterApi.getTweets(-1);
    expect(tweets[0].likes.length).to.equal(likeCount);
    expect(tweets[0].retweets.length).to.equal(retweetCount);
  });
});
