import { useState } from "react";
import { connectWallet, fetchAllocation, claimAirdrop, hasUserClaimed } from "./walletConnect";

function App() {
  const [walletAddress, setWalletAddress] = useState(null);
  const [allocation, setAllocation] = useState(null);
  const [claimed, setClaimed] = useState(false);
  const [claimStatus, setClaimStatus] = useState("");
  const [eligibilityChecked, setEligibilityChecked] = useState(false);

  const handleConnectWallet = async () => {
    const wallet = await connectWallet();
    if (wallet) {
      setWalletAddress(wallet.address);
      const userAllocation = await fetchAllocation(wallet.address);
      const hasClaimed = await hasUserClaimed(wallet.address);

      setAllocation(userAllocation);
      setClaimed(hasClaimed);
      setEligibilityChecked(true);
    }
  };

  const handleDisconnectWallet = () => {
    setWalletAddress(null);
    setAllocation(null);
    setClaimed(false);
    setClaimStatus("");
    setEligibilityChecked(false);
  };

  const handleClaimAirdrop = async () => {
    setClaimStatus("Processing...");

    const success = await claimAirdrop();
    if (success) {
      setClaimStatus("Airdrop claimed successfully!");
      setClaimed(true);
    } else {
      setClaimStatus("Airdrop claim failed.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white relative">
      {/* Disconnect Button at Top Right */}
      {walletAddress && (
        <button
          onClick={handleDisconnectWallet}
          className="absolute top-4 right-4 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-md text-sm font-semibold"
        >
          Disconnect
        </button>
      )}

      <h1 className="text-3xl font-bold mb-6">Elevated-King Airdrop</h1>

      {walletAddress ? (
        <>
          <p className="text-lg">Connected: {walletAddress}</p>

          {eligibilityChecked ? (
            allocation && parseFloat(allocation) > 0 ? (
              <>
                <p className="text-lg mt-4">Your Allocation: {allocation} $KING</p>
                <p className="mt-4 text-green-400 font-bold">Congratulations, you are eligible!</p>

                {claimed ? (
                  <p className="mt-4 text-green-400">You have already claimed your airdrop.</p>
                ) : (
                  <button
                    onClick={handleClaimAirdrop}
                    className="px-6 py-3 bg-green-600 hover:bg-green-700 rounded-md text-lg font-semibold mt-4"
                  >
                    Claim Airdrop
                  </button>
                )}
              </>
            ) : (
              <p className="mt-4 text-red-400 font-bold">Sorry, you are not eligible.</p>
            )
          ) : (
            <p className="mt-4 text-yellow-400">Checking eligibility...</p>
          )}

          {claimStatus && <p className="mt-2">{claimStatus}</p>}
        </>
      ) : (
        <button
          onClick={handleConnectWallet}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-md text-lg font-semibold"
        >
          Connect Wallet
        </button>
      )}
    </div>
  );
}

export default App;