/**
 * @type import('hardhat/config').HardhatUserConfig
 */

require("dotenv").config();
require("@nomiclabs/hardhat-ethers");
require("@nomiclabs/hardhat-waffle");
require("solidity-coverage");
require("solidity-docgen");

const { API_URL_ROPSTEN, API_URL_RINKEBY, PRIVATE_KEY } = process.env;

module.exports = {
  solidity: "0.8.13",
  // defaultNetwork: "ropsten",
  networks: {
    hardhat: {},
    ropsten: {
      url: API_URL_ROPSTEN || "",
      accounts: PRIVATE_KEY !== undefined ? [`0x${PRIVATE_KEY}`] : [],
    },
    rinkeby: {
      url: API_URL_RINKEBY || "",
      accounts: PRIVATE_KEY !== undefined ? [`0x${PRIVATE_KEY}`] : [],
    },
  },
};
