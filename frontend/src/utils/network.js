import { ethers } from 'ethers';

export const HARDHAT_NETWORK_ID = '31337';
export const HARDHAT_CHAIN_ID_HEX = '0x7a69'; // 31337 in hex

export const checkAndSwitchNetwork = async (provider) => {
  try {
    const network = await provider.getNetwork();
    if (network.chainId.toString() !== HARDHAT_NETWORK_ID) {
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: HARDHAT_CHAIN_ID_HEX }],
        });
        return true;
      } catch (switchError) {
        // This error code indicates that the chain has not been added to MetaMask.
        if (switchError.code === 4902) {
          try {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [
                {
                  chainId: HARDHAT_CHAIN_ID_HEX,
                  chainName: 'Hardhat Localhost',
                  rpcUrls: ['http://127.0.0.1:8545/'],
                  nativeCurrency: {
                    name: 'ETH',
                    symbol: 'ETH',
                    decimals: 18,
                  },
                },
              ],
            });
            return true;
          } catch (addError) {
            console.error("Failed to add network:", addError);
            return false;
          }
        }
        console.error("Failed to switch network:", switchError);
        return false;
      }
    }
    return true;
  } catch (error) {
    console.error("Error checking network:", error);
    return false;
  }
};
