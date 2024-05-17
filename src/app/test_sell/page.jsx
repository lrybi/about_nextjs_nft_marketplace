"use client";

import Image from "next/image";
import { useAccount } from 'wagmi';
import { abiERC721, networkMappingAddresses, abiNftMarketplace } from "../../../constants";
import { useWriteContract } from 'wagmi';
import { useChainId } from 'wagmi';
import { waitForTransactionReceipt } from '@wagmi/core';
import { config } from "../../../helper-wagmi-config";
import { parseEther, formatUnits } from "viem";
import { readContract } from '@wagmi/core';

  
export default function TestSell() {
  const { isConnected, isDisconnected /*, address, addresses */ } = useAccount()
  const chainId = useChainId();
  const marketplaceAddress = chainId  in networkMappingAddresses ? networkMappingAddresses[useChainId()].NftMarketplace[0] : null;
  const blockConfirmations = (chainId == 31337) ? 1 : 6;

  const nftAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
  const tokenId = 0;
  //console.log(BigInt(tokenId));
  const price = parseEther(String(10)).toString();

  const { isPending: isPendingWriteContract, error: errorWriteContract, writeContract } = useWriteContract()
  
  const WriteContractApproveListingVariables = {
    abi: abiERC721,
    address: nftAddress, 
    functionName: "approve",
    args: [marketplaceAddress, BigInt(tokenId)],
  }

  const WriteContractListItemVariables = {
    abi: abiNftMarketplace,
    address: marketplaceAddress, 
    functionName: "listItem",
    args: [nftAddress, BigInt(tokenId), BigInt(price)]
  }

  const approveAndList = async () => {
    console.log("Approving...");
    writeContract(WriteContractApproveListingVariables,
      {
        onError: (error) => console.log(error.message ?? error.shortMessage),
        onSuccess: async (hashApproveListing) => { await handleApproveSuccess(hashApproveListing) }
      }
    );
  }
  async function handleApproveSuccess (hashApproveListing) {
    console.log("Waiting for block Confirmations Approve listing...");
    console.log(hashApproveListing);
    await waitForTransactionReceipt(config,
      {
        hash: hashApproveListing,
        confirmations: blockConfirmations,
      }
    );
    console.log(`Approve listing confirmed! with ${blockConfirmations} blockConfirmations`);

    console.log('Ok! Now time to list');
    // console.log('WriteContractListItemVariables: ', WriteContractListItemVariables);
    writeContract(WriteContractListItemVariables,
      {
        onError: (error) => console.log(error.message ?? error.shortMessage),
        onSuccess: async (hashListItem) => { await handleListItemSuccess(hashListItem) }
      }
    );
  }
  async function handleListItemSuccess(hashListItem) {
    console.log("Waiting for block Confirmations List item...");
    console.log(hashListItem);
    await waitForTransactionReceipt(config,
      {
        hash: hashListItem,
        confirmations: blockConfirmations,
      }
    );
    console.log(`List item confirmed! with ${blockConfirmations} blockConfirmations`);
  }

  const getListing = async () => {
    const Listing = await readContract(config, {
      abi: abiNftMarketplace,
      address: marketplaceAddress, 
      functionName: "getListing",
      args: [nftAddress, BigInt(tokenId)],
    });
    console.log(Listing);
    console.log("seller:", Listing.seller); 
    console.log("price:", formatUnits(Listing["price"], 18), "ETH");
  }
  
  
  return (
    <div className="w-full">
      <div className=" flex flex-col items-center justify-center h-screen space-y-10">
        <h1 className=" text-4xl font-mono font-bold">
          {isDisconnected && ("Connet your wallet")}
        </h1> 
        {isConnected && (
          <div>
            <div>(CurrentNetwork ChainId: {chainId})</div>
            <div>
              <button
                  disabled={isPendingWriteContract}
                  onClick={approveAndList}
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded ml-auto"
              >
                  {isPendingWriteContract ? (
                      <div className="animate-spin spinner-border h-8 w-8 border-b-2 rounded-full"></div>
                  ) : (
                      "Approve and List"
                  )}
              </button>
            </div>

            <div>
              <button
                  disabled={isPendingWriteContract}
                  onClick={getListing}
                  className="bg-orange-500 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded ml-auto"
              >
                  {isPendingWriteContract ? (
                      <div className="animate-spin spinner-border h-8 w-8 border-b-2 rounded-full"></div>
                  ) : (
                      "Get Listing"
                  )}
              </button>
            </div>
          </div>
        )}        
      </div>
    </div>
  );
}
