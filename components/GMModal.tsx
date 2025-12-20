"use client";

import { useState, useEffect } from "react";
import { useWriteContract, useSwitchChain, useAccount } from "wagmi";
import { base, baseSepolia } from "wagmi/chains";
import { DAILY_GM_ADDRESS, DAILY_GM_ABI } from "@/lib/contract";
import toast from "react-hot-toast";

interface GMModalProps {
  onClose: () => void;
  address?: `0x${string}`;
}

export default function GMModal({ onClose }: GMModalProps) {
  const [friendAddress, setFriendAddress] = useState("");
  const [showFriendInput, setShowFriendInput] = useState(false);
  const { writeContract, isPending, isSuccess } = useWriteContract();
  const { switchChainAsync } = useSwitchChain();
  const { isConnected, chain } = useAccount();

  // Determine target chain based on environment
  const targetChain = process.env.NEXT_PUBLIC_CHAIN_ID === '8453' ? base : baseSepolia;
  const targetChainId = targetChain.id;
  const targetChainName = targetChain.name;

  // Use the actual wallet's chain ID, not the default from config
  const chainId = chain?.id;

  // Show success toast and close modal when transaction succeeds
  useEffect(() => {
    if (isSuccess) {
      toast.success("GM sent successfully! 🎉");
      setTimeout(() => {
        onClose();
        window.location.reload();
      }, 2000);
    }
  }, [isSuccess, onClose]);

  const handleGM = async () => {
    if (!isConnected) {
      toast.error("Please connect your wallet");
      return;
    }

    console.log("Current chainId:", chainId);
    console.log("Target chainId:", targetChainId);
    console.log("switchChainAsync available:", !!switchChainAsync);

    // Check if on correct network and switch if needed
    if (chainId !== targetChainId) {
      console.log("Wrong network detected, switching...");
      const switchToast = toast.loading(`Switching to ${targetChainName}...`);
      try {
        if (!switchChainAsync) {
          console.error("switchChainAsync not available");
          toast.error(`Please switch to ${targetChainName} network manually in your wallet`, { id: switchToast });
          return;
        }
        console.log("Calling switchChainAsync...");
        await switchChainAsync({ chainId: targetChainId });
        console.log("Network switched successfully");
        toast.success(`Switched to ${targetChainName}!`, { id: switchToast });
        // Wait a bit for the network to fully switch
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (err) {
        const error = err as Error;
        console.error("Error switching chain:", err);
        if (error.message?.includes("User rejected") || error.message?.includes("rejected")) {
          toast.error("Network switch cancelled", { id: switchToast });
        } else {
          toast.error(`Failed to switch network: ${error.message}`, { id: switchToast });
        }
        return;
      }
    }

    try {
      writeContract({
        address: DAILY_GM_ADDRESS,
        abi: DAILY_GM_ABI,
        functionName: "gm",
      });
    } catch (err) {
      const error = err as Error;
      if (error.message?.includes("User rejected")) {
        toast.error("Transaction rejected");
      } else if (error.message?.includes("AlreadyGMToday")) {
        toast.error("You already GM'd today! Come back tomorrow");
      } else {
        toast.error("Failed to send GM. Please try again");
      }
      console.error("Error sending GM:", err);
    }
  };

  const handleGMToFriend = () => {
    setShowFriendInput(true);
  };

  const handleSendGMToFriend = async () => {
    if (!isConnected) {
      toast.error("Please connect your wallet");
      return;
    }

    if (!friendAddress) {
      toast.error("Please enter a friend's address");
      return;
    }

    // Validate address format
    if (!friendAddress.startsWith("0x") || friendAddress.length !== 42) {
      toast.error("Invalid address format");
      return;
    }

    console.log("Current chainId:", chainId);
    console.log("Target chainId:", targetChainId);

    // Check if on correct network and switch if needed
    if (chainId !== targetChainId) {
      console.log("Wrong network detected for friend GM, switching...");
      const switchToast = toast.loading(`Switching to ${targetChainName}...`);
      try {
        if (!switchChainAsync) {
          console.error("switchChainAsync not available");
          toast.error(`Please switch to ${targetChainName} network manually in your wallet`, { id: switchToast });
          return;
        }
        console.log("Calling switchChainAsync...");
        await switchChainAsync({ chainId: targetChainId });
        console.log("Network switched successfully");
        toast.success(`Switched to ${targetChainName}!`, { id: switchToast });
        // Wait a bit for the network to fully switch
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (err) {
        const error = err as Error;
        console.error("Error switching chain:", err);
        if (error.message?.includes("User rejected") || error.message?.includes("rejected")) {
          toast.error("Network switch cancelled", { id: switchToast });
        } else {
          toast.error(`Failed to switch network: ${error.message}`, { id: switchToast });
        }
        return;
      }
    }

    try {
      writeContract({
        address: DAILY_GM_ADDRESS,
        abi: DAILY_GM_ABI,
        functionName: "gmTo",
        args: [friendAddress as `0x${string}`],
      });
    } catch (err) {
      const error = err as Error;
      if (error.message?.includes("User rejected")) {
        toast.error("Transaction rejected");
      } else if (error.message?.includes("AlreadyGMToday")) {
        toast.error("You already GM'd today! Come back tomorrow");
      } else if (error.message?.includes("InvalidRecipient")) {
        toast.error("Invalid recipient address");
      } else {
        toast.error("Failed to send GM. Please try again");
      }
      console.error("Error sending GM to friend:", error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-purple-700 to-purple-900 rounded-3xl p-8 max-w-md w-full shadow-2xl">
        <h2 className="text-white text-4xl font-bold text-center mb-6">
          Choose GM Type
        </h2>

        {!showFriendInput ? (
          <div className="space-y-4">
            <button
              onClick={handleGM}
              disabled={isPending}
              className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-6 rounded-2xl text-2xl font-bold hover:scale-105 transition-transform disabled:opacity-50"
            >
              {isPending ? "Sending..." : "GM"}
            </button>

            <button
              onClick={handleGMToFriend}
              className="w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white py-6 rounded-2xl text-2xl font-bold hover:scale-105 transition-transform"
            >
              GM to a Fren
            </button>

            <button
              onClick={onClose}
              className="w-full bg-gray-700 text-white py-6 rounded-2xl text-2xl font-bold hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Friend&apos;s address (0x...)"
              value={friendAddress}
              onChange={(e) => setFriendAddress(e.target.value)}
              className="w-full bg-purple-800/50 text-white py-4 px-6 rounded-xl text-lg placeholder-purple-300"
            />

            <button
              onClick={handleSendGMToFriend}
              disabled={isPending}
              className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-6 rounded-2xl text-2xl font-bold hover:scale-105 transition-transform disabled:opacity-50"
            >
              {isPending ? "Sending..." : "Send GM"}
            </button>

            <button
              onClick={() => setShowFriendInput(false)}
              className="w-full bg-gray-700 text-white py-6 rounded-2xl text-2xl font-bold hover:bg-gray-600 transition-colors"
            >
              Back
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
