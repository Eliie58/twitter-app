// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/// @title Twitter API. This contract allows a user to intercat with Twitter Smart Contract
/// @author Elie Yaacoub
interface TwitterApi {
    function addTweet(string calldata text) external returns (string memory);

    function updateTweet(uint256 tweetId, string calldata text) external;

    function deleteTweet(uint256 tweetId) external;

    function getTweets(uint256 lastId) external view returns (Tweet[] memory);

    function retweet(uint256 tweetId) external;

    function like(uint256 tweetId) external;

    function getMyAddress() external view returns (address);
}

/// @dev Struct Tweet used to represent a single Tweet
struct Tweet {
    uint256 id;
    uint256 publishedAt;
    address owner;
    string text;
    address[] likes;
    address[] retweets;
    bool deleted;
}

contract TwitterApiImpl is TwitterApi {
    Tweet[] tweets;
    uint256 tweetIdSeq;
    uint256 pageSize = 10;

    mapping(uint256 => mapping(address => uint256)) retweetsIndex;
    mapping(uint256 => mapping(address => uint256)) likesIndex;

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

    function getNewTweetId() private returns (uint256) {
        return tweetIdSeq++;
    }

    modifier tweetExists(uint256 tweetId) {
        require(
            tweets[tweetId].deleted == false,
            "The Tweet you are trying to access does not exist!"
        );
        _;
    }

    function updateTweet(uint256 tweetId, string calldata text)
        external
        override
        tweetExists(tweetId)
    {
        tweets[tweetId].text = text;
    }

    function deleteTweet(uint256 tweetId)
        external
        override
        tweetExists(tweetId)
    {
        tweets[tweetId].deleted = true;
    }

    function getTweets(uint256 lastId)
        external
        view
        override
        returns (Tweet[] memory)
    {
        if (tweets.length == 0) {
            return new Tweet[](0);
        }
        if (lastId == 0 || lastId > tweets.length) {
            lastId = tweets.length - 1;
        }
        uint256 found;
        Tweet[] memory toReturn = new Tweet[](pageSize);
        while (found < pageSize) {
            if (!tweets[lastId].deleted) {
                toReturn[found++] = tweets[lastId];
            }
            if (lastId == 0) break;
            lastId--;
        }
        return toReturn;
    }

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

    function like(uint256 tweetId) external override tweetExists(tweetId) {
        uint256 likeIndex = likesIndex[tweetId][msg.sender];
        // likeIndex is 0 if the tweet is not likeed already.
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
