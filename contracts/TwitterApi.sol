// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/// @title Twitter API Interface
/// @author Elie Yaacoub, Leonid Seniukov
/// @notice You can use this interface to create your own implementation of the Twitter API
interface TwitterApi {
  /// @notice Add a new Tweet by passing the text of the tweet
  /// @param text The text included in the tweet
  /// @return message to return information to calling party
  function addTweet(string calldata text) external returns (string memory);

  /// @notice Update the text of a tweet.
  /// @dev Only the owner of the tweet should be able to call this function
  /// @param tweetId the id of the tweet to update
  /// @param text the new content of the tweet
  function updateTweet(uint256 tweetId, string calldata text) external;

  /// @notice Delete a tweet
  /// @param tweetId the id of the tweet to delete
  function deleteTweet(uint256 tweetId) external;

  /// @notice Returns a page of tweets using the lastId parameter
  /// @dev Tweet order to return should be sorted chronologically, asc or desc
  /// @param lastId The id of the last tweet in the last returned page. Used for paging
  /// @return Tweet[] an array of tweets
  function getTweets(int256 lastId) external view returns (Tweet[] memory);

  /// @notice Retweet/Unretweet a tweet
  /// @param tweetId The id of the tweet to retweet/unretweet
  function retweet(uint256 tweetId) external;

  /// @notice Like/Unlike a tweet
  /// @param tweetId The id of the tweet to like/unlike
  function like(uint256 tweetId) external;

  /// @notice Utility function, to make sure contract is deployed and responding ("ping")
  /// @return Address the address of the calling wallet
  function getMyAddress() external view returns (address);
}

struct Tweet {
  uint256 id;
  uint256 publishedAt;
  address owner;
  string text;
  address[] likes;
  address[] retweets;
  bool deleted;
}

/// @title Twitter API Implementation
/// @author Elie Yaacoub, Leonid Seniukov
/// @notice You can use this interface to create your own implementation of the Twitter API
contract TwitterApiImpl is TwitterApi {
  /// @notice Array of all tweets
  Tweet[] private tweets;

  /// @notice The id sequence used to generate new tweet ids
  uint256 private tweetIdSeq;

  /// @notice The page size returned in getTweets function
  uint256 private pageSize = 10;

  /// @notice Mapping of tweet retweets
  /// @dev Maps id of the tweet to a mapping of address and id
  /// @dev The internal mapping is used for unretweet
  /// @dev For example, tweet with id 1, has 2 retweets
  /// @dev Retweet by user with address address1 is at position 0 in the tweet
  /// @dev retweets array
  /// @dev Retweet by user with address address2 is at position 1 in the tweet
  /// @dev retweets array
  mapping(uint256 => mapping(address => uint256)) private retweetsIndex;

  /// @notice Mapping of tweet likes
  /// @dev Maps id of the tweet to a mapping of address and id
  /// @dev The internal mapping is used for unlike
  /// @dev For example, tweet with id 1, has 2 likes
  /// @dev Like by user with address address1 is at position 0 in the tweet
  /// @dev likes array
  /// @dev Like by user with address address2 is at position 1 in the tweet
  /// @dev likes array
  mapping(uint256 => mapping(address => uint256)) private likesIndex;

  function addTweet(string calldata text)
    external
    override
    returns (string memory)
  {
    uint256 tweetId = getNewTweetId();
    Tweet memory tweet = Tweet({
      id: tweetId,
      publishedAt: block.timestamp,
      owner: msg.sender,
      text: text,
      likes: new address[](0),
      retweets: new address[](0),
      deleted: false
    });
    tweets.push(tweet);
    return "You just tweeted";
  }

  /// @notice Get next value from tweetIdSeq
  /// @return newTweetId the new tweet Id
  function getNewTweetId() private returns (uint256) {
    return tweetIdSeq++;
  }

  /// @notice Modifier to validate a tweet exists
  /// @param tweetId The id of the tweet to validate
  modifier tweetExists(uint256 tweetId) {
    require(tweets[tweetId].deleted == false, "Tweet doesn't exist");
    _;
  }

  /// @notice Modifier to validate sender is tweet owner
  /// @param tweetId The id of the tweet to validate
  modifier isOwner(uint256 tweetId) {
    require(tweets[tweetId].owner == msg.sender, "Only owner can take action");
    _;
  }

  /// @notice Update the text of a tweet.
  /// @dev Uses modifiers `tweetExists` and `isOwner`
  /// @param tweetId the id of the tweet to update
  /// @param text the new content of the tweet
  function updateTweet(uint256 tweetId, string calldata text)
    external
    override
    tweetExists(tweetId)
    isOwner(tweetId)
  {
    tweets[tweetId].text = text;
  }

  /// @notice Delete a tweet
  /// @dev Uses modifiers `tweetExists` and `isOwner`
  /// @param tweetId the id of the tweet to delete
  function deleteTweet(uint256 tweetId)
    external
    override
    tweetExists(tweetId)
    isOwner(tweetId)
  {
    tweets[tweetId].deleted = true;
  }

  /// @notice Returns a page of tweets using the lastId parameter, ordered chronologically desc
  /// @dev Checks if lastId is negative, or > size of tweets array,
  /// @dev then starts iterating from the end of the array.
  /// @dev Iterates the tweets array, by descending index, checking if tweet at
  /// @dev current index is not deleted, and adds it to return tweet array
  /// @dev Stops when it reaches beginning of the tweet array, or page is full
  /// @param lastId The id of the last tweet in the last returned page. Used for paging
  /// @return Tweet[] an array of tweets
  function getTweets(int256 lastId)
    external
    view
    override
    returns (Tweet[] memory)
  {
    if (tweets.length == 0) {
      return new Tweet[](0);
    }
    if (lastId < 0 || lastId > int256(tweets.length)) {
      lastId = int256(tweets.length) - 1;
    }
    uint256 found;
    Tweet[] memory toReturn = new Tweet[](pageSize);
    while (found < pageSize) {
      if (!tweets[uint256(lastId)].deleted) {
        toReturn[found++] = tweets[uint256(lastId)];
      }
      if (lastId == 0) break;
      lastId--;
    }
    return toReturn;
  }

  /// @notice Retweet/Unretweet a tweet
  /// @dev Checks if sender already retweeted the tweet, by using retweetsIndex
  /// @dev mapping.
  /// @dev If not retweeted, adds sender address to tweet retweets array and to
  /// @dev retweetsIndex mapping.
  /// @dev If already retweeted, removes the sender address from tweet retweets array,
  /// @dev and replaces it with the last item in array, and updates the retweetsIndex
  /// @dev mapping to reflect the changes
  /// @param tweetId The id of the tweet to retweet/unretweet
  function retweet(uint256 tweetId) external override tweetExists(tweetId) {
    uint256 retweetIndex = retweetsIndex[tweetId][msg.sender];
    // retweetIndex is 0 if the tweet is not retweeted already.
    // We will retweet it
    address[] storage retweets = tweets[tweetId].retweets;
    if (retweetIndex == 0) {
      uint256 index = retweets.length;
      retweets.push(msg.sender);
      retweetsIndex[tweetId][msg.sender] = index + 1;
    } else {
      address tempAddress = retweets[retweets.length - 1];
      retweets[retweetIndex - 1] = tempAddress;
      delete retweets[retweets.length - 1];
      retweets.pop();
      retweetsIndex[tweetId][tempAddress] = retweetIndex;
      retweetsIndex[tweetId][msg.sender] = 0;
    }
  }

  /// @notice Like/Unlike a tweet
  /// @dev Checks if sender already liked the tweet, by using likesIndex
  /// @dev mapping.
  /// @dev If not liked, adds sender address to tweet likes array and to
  /// @dev likesIndex mapping.
  /// @dev If already liked, removes the sender address from tweet likes array,
  /// @dev and replaces it with the last item in array, and updates the likesIndex
  /// @dev mapping to reflect the changes
  /// @param tweetId The id of the tweet to retweet/unretweet
  function like(uint256 tweetId) external override tweetExists(tweetId) {
    uint256 likeIndex = likesIndex[tweetId][msg.sender];
    // likeIndex is 0 if the tweet is not liked already.
    // We will like it
    address[] storage likes = tweets[tweetId].likes;
    if (likeIndex == 0) {
      uint256 index = likes.length;
      likes.push(msg.sender);
      likesIndex[tweetId][msg.sender] = index + 1;
    } else {
      address tempAddress = likes[likes.length - 1];
      likes[likeIndex - 1] = tempAddress;
      delete likes[likes.length - 1];
      likes.pop();
      likesIndex[tweetId][tempAddress] = likeIndex;
      likesIndex[tweetId][msg.sender] = 0;
    }
  }

  function getMyAddress() external view override returns (address) {
    return msg.sender;
  }
}
