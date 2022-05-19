# Solidity API

## TwitterApi

You can use this interface to create your own implementation of the Twitter API

### addTweet

```solidity
function addTweet(string text) external returns (string)
```

Add a new Tweet by passing the text of the tweet

| Name | Type | Description |
| ---- | ---- | ----------- |
| text | string | The text included in the tweet |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | string | message to return information to calling party |

### updateTweet

```solidity
function updateTweet(uint256 tweetId, string text) external
```

Update the text of a tweet.

_Only the owner of the tweet should be able to call this function_

| Name | Type | Description |
| ---- | ---- | ----------- |
| tweetId | uint256 | the id of the tweet to update |
| text | string | the new content of the tweet |

### deleteTweet

```solidity
function deleteTweet(uint256 tweetId) external
```

Delete a tweet

| Name | Type | Description |
| ---- | ---- | ----------- |
| tweetId | uint256 | the id of the tweet to delete |

### getTweets

```solidity
function getTweets(int256 lastId) external view returns (struct Tweet[])
```

Returns a page of tweets using the lastId parameter

_Tweet order to return should be sorted chronologically, asc or desc_

| Name | Type | Description |
| ---- | ---- | ----------- |
| lastId | int256 | The id of the last tweet in the last returned page. Used for paging |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | struct Tweet[] | Tweet[] an array of tweets |

### retweet

```solidity
function retweet(uint256 tweetId) external
```

Retweet/Unretweet a tweet

| Name | Type | Description |
| ---- | ---- | ----------- |
| tweetId | uint256 | The id of the tweet to retweet/unretweet |

### like

```solidity
function like(uint256 tweetId) external
```

Like/Unlike a tweet

| Name | Type | Description |
| ---- | ---- | ----------- |
| tweetId | uint256 | The id of the tweet to like/unlike |

### getMyAddress

```solidity
function getMyAddress() external view returns (address)
```

Utility function, to make sure contract is deployed and responding (&quot;ping&quot;)

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | address | Address the address of the calling wallet |

## Tweet

```solidity
struct Tweet {
  uint256 id;
  uint256 publishedAt;
  address owner;
  string text;
  address[] likes;
  address[] retweets;
  bool deleted;
}
```

## TwitterApiImpl

You can use this interface to create your own implementation of the Twitter API

### tweets

```solidity
struct Tweet[] tweets
```

Array of all tweets

### tweetIdSeq

```solidity
uint256 tweetIdSeq
```

The id sequence used to generate new tweet ids

### pageSize

```solidity
uint256 pageSize
```

The page size returned in getTweets function

### retweetsIndex

```solidity
mapping(uint256 &#x3D;&gt; mapping(address &#x3D;&gt; uint256)) retweetsIndex
```

Mapping of tweet retweets

_Maps id of the tweet to a mapping of address and id
The internal mapping is used for unretweet
For example, tweet with id 1, has 2 retweets
Retweet by user with address address1 is at position 0 in the tweet
retweets array
Retweet by user with address address2 is at position 1 in the tweet
retweets array_

### likesIndex

```solidity
mapping(uint256 &#x3D;&gt; mapping(address &#x3D;&gt; uint256)) likesIndex
```

Mapping of tweet likes

_Maps id of the tweet to a mapping of address and id
The internal mapping is used for unlike
For example, tweet with id 1, has 2 likes
Like by user with address address1 is at position 0 in the tweet
likes array
Like by user with address address2 is at position 1 in the tweet
likes array_

### addTweet

```solidity
function addTweet(string text) external returns (string)
```

Add a new Tweet by passing the text of the tweet

| Name | Type | Description |
| ---- | ---- | ----------- |
| text | string | The text included in the tweet |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | string | message to return information to calling party |

### getNewTweetId

```solidity
function getNewTweetId() private returns (uint256)
```

Get next value from tweetIdSeq

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | newTweetId the new tweet Id |

### tweetExists

```solidity
modifier tweetExists(uint256 tweetId)
```

Modifier to validate a tweet exists

| Name | Type | Description |
| ---- | ---- | ----------- |
| tweetId | uint256 | The id of the tweet to validate |

### isOwner

```solidity
modifier isOwner(uint256 tweetId)
```

Modifier to validate sender is tweet owner

| Name | Type | Description |
| ---- | ---- | ----------- |
| tweetId | uint256 | The id of the tweet to validate |

### updateTweet

```solidity
function updateTweet(uint256 tweetId, string text) external
```

Update the text of a tweet.

_Uses modifiers &#x60;tweetExists&#x60; and &#x60;isOwner&#x60;_

| Name | Type | Description |
| ---- | ---- | ----------- |
| tweetId | uint256 | the id of the tweet to update |
| text | string | the new content of the tweet |

### deleteTweet

```solidity
function deleteTweet(uint256 tweetId) external
```

Delete a tweet

_Uses modifiers &#x60;tweetExists&#x60; and &#x60;isOwner&#x60;_

| Name | Type | Description |
| ---- | ---- | ----------- |
| tweetId | uint256 | the id of the tweet to delete |

### getTweets

```solidity
function getTweets(int256 lastId) external view returns (struct Tweet[])
```

Returns a page of tweets using the lastId parameter, ordered chronologically desc

_Checks if lastId is negative, or &gt; size of tweets array,
then starts iterating from the end of the array.
Iterates the tweets array, by descending index, checking if tweet at
current index is not deleted, and adds it to return tweet array
Stops when it reaches beginning of the tweet array, or page is full_

| Name | Type | Description |
| ---- | ---- | ----------- |
| lastId | int256 | The id of the last tweet in the last returned page. Used for paging |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | struct Tweet[] | Tweet[] an array of tweets |

### retweet

```solidity
function retweet(uint256 tweetId) external
```

Retweet/Unretweet a tweet

_Checks if sender already retweeted the tweet, by using retweetsIndex
mapping.
If not retweeted, adds sender address to tweet retweets array and to
retweetsIndex mapping.
If already retweeted, removes the sender address from tweet retweets array,
and replaces it with the last item in array, and updates the retweetsIndex
mapping to reflect the changes_

| Name | Type | Description |
| ---- | ---- | ----------- |
| tweetId | uint256 | The id of the tweet to retweet/unretweet |

### like

```solidity
function like(uint256 tweetId) external
```

Like/Unlike a tweet

_Checks if sender already liked the tweet, by using likesIndex
mapping.
If not liked, adds sender address to tweet likes array and to
likesIndex mapping.
If already liked, removes the sender address from tweet likes array,
and replaces it with the last item in array, and updates the likesIndex
mapping to reflect the changes_

| Name | Type | Description |
| ---- | ---- | ----------- |
| tweetId | uint256 | The id of the tweet to retweet/unretweet |

### getMyAddress

```solidity
function getMyAddress() external view returns (address)
```

Utility function, to make sure contract is deployed and responding (&quot;ping&quot;)

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | address | Address the address of the calling wallet |

