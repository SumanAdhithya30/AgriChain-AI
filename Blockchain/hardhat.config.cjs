// require("@nomicfoundation/hardhat-toolbox");

// /** @type import('hardhat/config').HardhatUserConfig */
// module.exports = {
//   solidity: "0.8.24",
// };
require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config(); // This line loads your .env file

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.24",
  networks: {
    hardhat: {
      blockGasLimit: 30000000,
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      gas: 12000000,
    },
    amoy: {
      // This picks up the RPC URL from your .env file
      url: process.env.AMOY_RPC_URL || "",
      // This picks up the private key from your .env file
      accounts:
        process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
  },
};