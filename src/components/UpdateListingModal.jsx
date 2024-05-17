"use client"

import { Modal, Image, InputNumber, message, Button, Skeleton } from 'antd';
import { useState } from 'react';
import { useWriteContract } from 'wagmi';
import { waitForTransactionReceipt } from '@wagmi/core';
import { abiNftMarketplace } from "../../constants/index";
import { parseEther, formatUnits } from 'viem';
import { useChainId } from 'wagmi';
import { config } from "../../helper-wagmi-config";
import { useAccount } from 'wagmi';


export default function UpdateListingModal({
    nftAddress,
    tokenId,
    isVisible,
    marketplaceAddress,
    onClose,
    imageURL,
    currentPrice,
    seller
}) {
    const [priceToUpdateListingWith, setPriceToUpdateListingWith] = useState(0);
    const { address} = useAccount();
    const isOwnedByYou = (seller.toLowerCase() === address.toLowerCase());
    const chainId = useChainId();
    //const blockConfirmations = (chainId == 31337) ? 1 : 2;
    const blockConfirmations = (chainId == 31337) ? 1 : 1;
    const [messageApi, contextHolder] = message.useMessage();  
    const [isConfirmationsMessageApiLoading, setIsConfirmationsMessageApiLoading] = useState(false);
    
    const { isPending: isPendingWriteContract, writeContract } = useWriteContract();

    const WriteContractBuyItemVariables = {
        abi: abiNftMarketplace,
        address: marketplaceAddress, 
        functionName: "buyItem",
        args: [nftAddress, BigInt(tokenId)],
        value: currentPrice, 
    }
    async function handleBuyItemSuccess(hashBuyItem) {
        messageApi.destroy();
        setIsConfirmationsMessageApiLoading(true);
        messageApi.open({
            type: 'loading',
            content: 'Waiting for block Confirmations...',
            duration: 0,
        });
        await waitForTransactionReceipt(config,
            {
                hash: hashBuyItem,
                confirmations: blockConfirmations,
            }
        );
        messageApi.destroy();
        messageApi.open({
            type: 'success',
            content: 'Buy Item confirmed!',
        });
    };
    
    const WriteContractUpdateListingVariables = {
        abi: abiNftMarketplace,
        address: marketplaceAddress, 
        functionName: "updateListing",
        args: [nftAddress, BigInt(tokenId), BigInt(parseEther(String(priceToUpdateListingWith || '0')))],
    }

    const WriteContractCancelListingVariables = {
        abi: abiNftMarketplace,
        address: marketplaceAddress, 
        functionName: "cancelListing",
        args: [nftAddress, BigInt(tokenId)],
    }

    async function handleUpdateListingSuccess(hashUpdateListing) {
        messageApi.destroy();
        messageApi.open({
            type: 'loading',
            content: 'Waiting for block Confirmations...',
            duration: 0,
        });
        setIsConfirmationsMessageApiLoading(true);
        await waitForTransactionReceipt(config,
            {
                hash: hashUpdateListing,
                confirmations: blockConfirmations,
            }
        );
        messageApi.destroy();
        setIsConfirmationsMessageApiLoading(false);
        onClose && onClose();
        setPriceToUpdateListingWith('0');
    
        messageApi.open({
            type: 'success',
            content: 'Update Listing confirmed!',
        });
    }

    async function handleCancelListingSuccess(hashCancelListing) {
        messageApi.destroy();
        messageApi.open({
            type: 'loading',
            content: 'Waiting for block Confirmations...',
            duration: 0,
        });
        setIsConfirmationsMessageApiLoading(true);
        await waitForTransactionReceipt(config,
            {
                hash: hashCancelListing,
                confirmations: blockConfirmations,
            }
        );
        messageApi.destroy();
        setIsConfirmationsMessageApiLoading(false);
        onClose && onClose();
       
        messageApi.open({
            type: 'success',
            content: 'Cancel Listing confirmed!',
        });
    }


    return (
        <>
            {contextHolder}
        
            <Modal
                open={isVisible}
                onCancel={() => { onClose(); setPriceToUpdateListingWith("0")}}
                onOk={isOwnedByYou ? (
                    () => {
                        messageApi.open({
                            type: 'loading',
                            content: 'Wait for confirming...',
                            duration: 0,
                        });
                        console.log("priceToUpdateListingWith:", priceToUpdateListingWith)
                        console.log("price:",BigInt(parseEther(String(priceToUpdateListingWith || '0'))))
                        writeContract(
                            WriteContractUpdateListingVariables,
                            {
                                onError: (error) => {
                                    console.log(error.message ?? error.shortMessage);
                                    messageApi.destroy();
                                    messageApi.open({
                                        type: 'error',
                                        content: error.shortMessage,
                                    });
                                },
                                onSuccess: async (hashUpdateListing) => await handleUpdateListingSuccess(hashUpdateListing)
                            }
                        )
                    }
                ) : (
                        () => {
                            messageApi.open({
                                type: 'loading',
                                content: 'Wait for confirming...',
                                duration: 0,
                            });
                            writeContract(
                                WriteContractBuyItemVariables,
                                {
                                    onError: (error) => {
                                        console.log(error.message ?? error.shortMessage);
                                        messageApi.destroy();
                                        messageApi.open({
                                        type: 'error',
                                        content: error.shortMessage,
                                        });
                                    },
                                    onSuccess: async (hashBuyItem) => await handleBuyItemSuccess(hashBuyItem)
                                }
                            )
                        }
                    )
                }
                title="NFT Details"
                okText={isOwnedByYou ? ("Save New Listing Price") : ("Buy NFT") }
                cancelText="Leave it"
                centered={true}
                confirmLoading={isPendingWriteContract || isConfirmationsMessageApiLoading}
                destroyOnClose={true}
            >
                <div
                    style={{
                        alignItems: "center",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                    }}
                >
                    <div className="flex flex-col items-center gap-4">
                        <p className="p-4 text-lg">
                            {isOwnedByYou ? ("This is your listing. You may either update the listing price or cancel it.") : ("You can buy this NFT") }
                        </p>
                        <div className="flex flex-col items-end gap-2 border-solid border-2 border-gray-400 rounded p-2 w-fit">
                            <div>#{tokenId}</div>
                            {imageURL ? (
                                <Image
                                    alt='nft'
                                    src={imageURL}
                                    height={200}
                                    width={200}
                                />
                            ) : (
                                    <Skeleton.Image />
                                )
                            }
                            <div className="font-bold">
                                {formatUnits(currentPrice || 0, 18)} ETH
                            </div>
                        </div>
                        {isOwnedByYou && 
                            <div className='flex items-center'>
                                <span className='text-gray-500 flex-shrink-0'>Update listing price in L1 Currency (ETH)：</span>

                                <InputNumber
                                    min={0}
                                    onChange={(value) => {
                                        setPriceToUpdateListingWith(value);
                                    }}
                                    
                                    size="large"
                                    addonAfter='ETH'
                                    disabled={isPendingWriteContract || isConfirmationsMessageApiLoading}
                                />
                            </div>
                        }
                        
                        {isOwnedByYou && 
                            <div>
                                <span className='text-gray-500 flex-shrink-0'>or </span>
                                <Button
                                    disabled={isPendingWriteContract || isConfirmationsMessageApiLoading}
                                    type="primary"
                                    size='large'
                                    onClick={() => {
                                        messageApi.open({
                                            type: 'loading',
                                            content: 'Wait for confirming...',
                                            duration: 0,
                                        });
                                        writeContract(
                                            WriteContractCancelListingVariables,
                                            {
                                                onError: (error) => {
                                                    console.log(error.message ?? error.shortMessage);
                                                    messageApi.destroy();
                                                    messageApi.open({
                                                    type: 'error',
                                                    content: error.shortMessage,
                                                    });
                                                },
                                                onSuccess: async (hashCancelListing) => await handleCancelListingSuccess(hashCancelListing)
                                            }
                                        )
                                    }
                                    }

                                >
                                    Cancel Listing
                                </Button>
                            </div>
                        }
                    </div>
                </div>
            </Modal>
        </>
    )

}