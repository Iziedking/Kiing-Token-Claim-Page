import { ethers } from "ethers";
import { EthereumProvider } from "@walletconnect/ethereum-provider"; 

const AIRDROP_CONTRACT = import.meta.env.VITE_AIRDROP_CONTRACT;
const RPC_URL = import.meta.env.VITE_RPC_URL;

// WalletConnect Project ID (Replace with yours)
const WALLETCONNECT_PROJECT_ID = "0a95a76881d2fa239f1a61e56ce726a0"; 

// Monad Testnet Chain ID
const MONAD_TESTNET_CHAIN_ID = "0x279F"; 

// Monad Testnet Configuration
const MONAD_TESTNET_PARAMS = {
  chainId: MONAD_TESTNET_CHAIN_ID,
  chainName: "Monad Testnet",
  nativeCurrency: { name: "MON", symbol: "MON", decimals: 18 },
  rpcUrls: ["https://testnet-rpc.monad.xyz/"],
  blockExplorerUrls: ["http://testnet.monadexplorer.com/"],
};

const abi = [
  "event AddressWhitelisted(address indexed wallet, uint256 amount)",
  "event AirdropClaimed(address indexed recipient, uint256 amount)",
  "event AirdropFunded(uint256 amount)",
  "function claimAirdrop() public",
  "function fundAirdrop() public",
  "function whitelistAddresses(address[] wallets, uint256[] amounts) public",
  "function allocations(address user) public view returns (uint256)",
  "function hasClaimed(address user) public view returns (bool)",
  "function kingToken() public view returns (address)",
  "function owner() public view returns (address)",
  "function totalAirdrop() public view returns (uint256)",
];


let walletConnectProvider = null;

// To initialize WalletConnect
const initWalletConnect = async () => {
  if (!walletConnectProvider) {
    walletConnectProvider = await EthereumProvider.init({
      projectId: WALLETCONNECT_PROJECT_ID,
      chains: [10143],
      showQrModal: true,
    });
  }
  return walletConnectProvider;
};

// To connect wallet (MetaMask or WalletConnect)
export const connectWallet = async () => {
  if (!window.ethereum && !walletConnectProvider) {
    alert("No wallet found! Please install MetaMask or use WalletConnect.");
    return null;
  }

  try {
    let provider;
    let signer;
    let address;

    // Show wallet selection modal
    const userChoice = window.confirm("Use MetaMask? Click 'Cancel' for WalletConnect.");

    if (userChoice && window.ethereum) {
      // MetaMask
      provider = new ethers.BrowserProvider(window.ethereum);
      signer = await provider.getSigner();
    } else {
      // WalletConnect
      const wcProvider = await initWalletConnect();
      await wcProvider.enable();
      provider = new ethers.BrowserProvider(wcProvider);
      signer = await provider.getSigner();
    }

    address = await signer.getAddress();

    // Check network
    const network = await provider.getNetwork();
    if (network.chainId !== BigInt(MONAD_TESTNET_CHAIN_ID)) {
      alert("You're on the wrong network. Switching to Monad Testnet...");
      await switchToMonadTestnet();
      return { provider, signer, address, wrongNetwork: true };
    }

    return { provider, signer, address, wrongNetwork: false };
  } catch (error) {
    console.error("Wallet connection failed:", error);
    return null;
  }
};

export const switchToMonadTestnet = async () => {
  if (!window.ethereum) {
    alert("MetaMask is required to switch networks.");
    return;
  }

  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: MONAD_TESTNET_CHAIN_ID }],
    });
    alert("Switched to Monad Testnet!");
  } catch (error) {
    if (error.code === 4902) {
      try {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [MONAD_TESTNET_PARAMS],
        });
        alert("Monad Testnet added. Please switch networks and try again.");
      } catch (addError) {
        console.error("Failed to add Monad Testnet:", addError);
      }
    } else {
      console.error("Failed to switch network:", error);
    }
  }
};

export const fetchAllocation = async (walletAddress) => {
  try {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const contract = new ethers.Contract(AIRDROP_CONTRACT, abi, provider);
    const amount = await contract.allocations(walletAddress);
    return ethers.formatUnits(amount, 18);
  } catch (error) {
    console.error("Failed to fetch allocation:", error);
    return "0";
  }
};

export const hasUserClaimed = async (walletAddress) => {
  try {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const contract = new ethers.Contract(AIRDROP_CONTRACT, abi, provider);
    return await contract.hasClaimed(walletAddress);
  } catch (error) {
    console.error("Failed to check claim status:", error);
    return false;
  }
};

export const claimAirdrop = async () => {
  if (!window.ethereum && !walletConnectProvider) {
    alert("Please install MetaMask or use WalletConnect!");
    return false;
  }

  try {
    let provider;
    let signer;

    if (window.ethereum) {
      provider = new ethers.BrowserProvider(window.ethereum);
      signer = await provider.getSigner();
    } else {
      const wcProvider = await initWalletConnect();
      await wcProvider.enable();
      provider = new ethers.BrowserProvider(wcProvider);
      signer = await provider.getSigner();
    }

    // Ensure the user is on Monad Testnet
    const network = await provider.getNetwork();
    if (network.chainId !== BigInt(MONAD_TESTNET_CHAIN_ID)) {
      alert("Please switch to Monad Testnet before claiming.");
      await switchToMonadTestnet();
      return false;
    }

    const contract = new ethers.Contract(AIRDROP_CONTRACT, abi, signer);
    const tx = await contract.claimAirdrop();
    await tx.wait();
    
    return true; 
  } catch (error) {
    console.error("Airdrop claim failed:", error);
    return false;
  }
};