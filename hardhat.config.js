/**
 * @type import('hardhat/config').HardhatUserConfig
 */

require('dotenv').config();
require("@nomiclabs/hardhat-ethers");

const {
    API_URL_ROPSTEN,
    API_URL_RINKEBY,
    PRIVATE_KEY,
} = process.env;

module.exports = {
    solidity: "0.8.13",
    defaultNetwork: "ropsten",
    networks: {
        hardhat: {},
        ropsten: {
            url: API_URL_ROPSTEN,
            accounts: [`0x${PRIVATE_KEY}`]
        },
        rinkeby: {
            url: API_URL_RINKEBY,
            accounts: [`0x${PRIVATE_KEY}`]
        }
    },
}