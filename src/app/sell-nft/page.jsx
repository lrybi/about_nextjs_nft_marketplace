"use client";

import Image from "next/image";
import { useAccount } from 'wagmi';
import { Form, Input, InputNumber, message, Button } from 'antd';
import { abiERC721, networkMappingAddresses, abiNftMarketplace } from "../../../constants";
import { useWriteContract } from 'wagmi';
import { waitForTransactionReceipt } from '@wagmi/core';
import { parseEther, formatUnits } from "viem";
import { useChainId } from 'wagmi';
import { useState, useEffect } from 'react';
import { config } from "../../../helper-wagmi-config";
import { readContract } from '@wagmi/core';



  
export default function Sell() {
  const { isConnected, isDisconnected, address } = useAccount()
  const chainId = useChainId();
  const marketplaceAddress = chainId  in networkMappingAddresses ? networkMappingAddresses[useChainId()].NftMarketplace[0] : null;
  //const blockConfirmations = (chainId == 31337) ? 1 : 2;
  const blockConfirmations = (chainId == 31337) ? 1 : 1;
  const [proceeds, setProceeds] = useState('0');
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  
  const { isPending: isPendingWriteContract, writeContract } = useWriteContract();
  

  const approveAndList = async (values) => {
    
    console.log('Approving...');

    const nftAddress = values.nftAddress;
    console.log("NFT Address:", nftAddress);
    const tokenId = values["tokenId"];
    console.log("Token ID:", tokenId);
    const price = parseEther(String(values.price)).toString();
    // console.log(BigInt(price));
    
    const WriteContractApproveListingVariables = {
      abi: abiERC721,
      address: nftAddress, 
      functionName: "approve",
      args: [marketplaceAddress, BigInt(tokenId)],
    }
    console.log("writeContractApproveListing...")
    form.resetFields();
    messageApi.open({
      type: 'loading',
      content: 'Wait for confirming...',
      duration: 0,
    });
    writeContract(WriteContractApproveListingVariables,
      {
        onError: (error) => {
          console.log(error.message ?? error.shortMessage);
          messageApi.destroy();
          messageApi.open({
            type: 'error',
            content: error.shortMessage,
          });
        },
        onSuccess: async (hashApproveListing) => { await handleApproveSuccess(hashApproveListing, nftAddress, tokenId, price) }
      }
    );
  };
  
  async function handleApproveSuccess(hashApproveListing, nftAddress, tokenId, price) {
    messageApi.destroy();
    console.log("Waiting for block Confirmations Approve listing...");
    console.log(hashApproveListing);
    messageApi.open({
      type: 'loading',
      content: 'Waiting for block Confirmations...',
      duration: 0,
    });
    await waitForTransactionReceipt(config,
      {
        hash: hashApproveListing,
        confirmations: blockConfirmations,
      }
    );
    console.log(`Approve listing confirmed! (with ${blockConfirmations} blockConfirmations)`);
    messageApi.destroy();

    console.log('Ok! Now time to list');
    console.log("NFT Address:", nftAddress);
    console.log("Token ID:", tokenId);
    console.log("Price:", formatUnits(BigInt(price), 18), "ETH");
    messageApi.open({
      type: 'loading',
      content: 'Wait for confirming...',
      duration: 0,
    });
    const WriteContractListItemVariables = {
      abi: abiNftMarketplace,
      address: marketplaceAddress, 
      functionName: "listItem",
      args: [nftAddress, BigInt(tokenId), BigInt(price)]
    }
    writeContract(WriteContractListItemVariables,
      {
        onError: (error) => {
          console.log(error.message ?? error.shortMessage);
          messageApi.destroy();
          messageApi.open({
            type: 'error',
            content: error.shortMessage,
          });
        },
        onSuccess: async (hashListItem) => { await handleListItemSuccess(hashListItem) }
      }
    );
  }

  async function handleListItemSuccess(hashListItem) {
    messageApi.destroy();
    console.log("Waiting for block Confirmations List item...");
    console.log(hashListItem);
    messageApi.open({
      type: 'loading',
      content: 'Waiting for block Confirmations...',
      duration: 0,
    });
    await waitForTransactionReceipt(config,
      {
        hash: hashListItem,
        confirmations: blockConfirmations,
      }
    );
    console.log(`List item confirmed! (with ${blockConfirmations} blockConfirmations)`);
    messageApi.destroy();
    messageApi.open({
      type: 'success',
      content: 'List item confirmed!',
    });
  }
  

  const WriteContractWithdrawProceedsVariables = {
    abi: abiNftMarketplace,
    address: marketplaceAddress, 
    functionName: "withdrawProceeds",
    args: [],
  }
  const handleWithdrawSuccess = async (hashWithdrawProceeds) => {
    messageApi.destroy();
    console.log("Waiting for block Confirmations Withdraw Proceeds...");
    console.log(hashWithdrawProceeds);
    messageApi.open({
      type: 'loading',
      content: 'Waiting for block Confirmations...',
      duration: 0,
    });
    await waitForTransactionReceipt(config,
      {
        hash: hashWithdrawProceeds,
        confirmations: blockConfirmations,
      }
    );
    console.log(`Withdraw confirmed! (with ${blockConfirmations} blockConfirmations)`);
    messageApi.destroy();

    updateProceedsUI();
    messageApi.open({
      type: 'success',
      content: 'Withdraw confirmed!',
    });
  }

  async function updateProceedsUI() {
    if (chainId == 11155111) {
      const returnedProceeds = await readContract(config, {
        abi: abiNftMarketplace,
        address: marketplaceAddress, 
        functionName: "getProceeds",
        args: [address],
      });
      //console.log("returnedProceeds:", returnedProceeds);
  
      setProceeds(returnedProceeds.toString());
    }
  }

  useEffect(() => {
    if (isConnected) {
      updateProceedsUI();
    }
  }, [ address, isConnected, chainId ]);
  
 
  return (
    <>
      {contextHolder}

      <div className="w-full">
        <div className=" flex flex-col items-center justify-center h-screen space-y-10">
          <h1 className=" text-4xl font-mono font-bold">
            {isDisconnected && ("Connet your wallet (with sepolia nerwork)")}
            {(isConnected && (chainId != 11155111)) && ("Please switch to sepolia nerwork")}
          </h1> 
          {(isConnected && (chainId == 11155111)) && (
            <div>
              

              <h1 className=" text-4xl font-mono font-bold text-rose-500">Sell your NFT</h1>
              <Form
                form={form}
                size="large"
                name="mainForm"
                onFinish={approveAndList}
                autoComplete="off"
                layout="vertical"
                initialValues={{
                  'nftAddress': null,
                  'tokenId': null,
                  'price': null,
                }}
              >
                <Form.Item
                  label="NFT Address"
                  name="nftAddress"
                  rules={[
                    {
                      required: true,
                      message: 'Please input your NFT Address!',
                    },
                  ]}
                >
                  <Input />
                </Form.Item>
                <Form.Item
                  label="Token ID"
                  name="tokenId"
                  rules={[
                    {
                      type: 'number',
                      required: true,
                      min: 0,
                      message: 'Please input valid Token ID!',
                    },
                  ]}
                >
                  <InputNumber
                    min={0}
                  />
                </Form.Item>
                <Form.Item
                  label="Price (ETH)"
                  name="price"
                  rules={[
                    {
                      type: 'number',
                      required: true,
                      min: 0,
                      message: 'Please input valid price!',
                    },
                  ]}
                >
                  <InputNumber
                    min={0}
                  />
                </Form.Item>

                <Form.Item
                  wrapperCol={{
                    offset: 8,
                    span: 16,
                  }}
                >
                  <Button
                    type="primary"
                    size='large'
                    htmlType="submit"
                    disabled={isPendingWriteContract}
                  >
                    Submit
                  </Button>
                </Form.Item>
              </Form> 
              
              <div>
                {(proceeds != 0) && <h1 className=" text-2xl font-mono font-bold text-green-500">Withdraw {proceeds} proceeds</h1>}
              </div>
              {proceeds != '0' ? (
                <Button
                  type="primary"
                  onClick={() => {
                    messageApi.open({
                      type: 'loading',
                      content: 'Wait for confirming...',
                      duration: 0,
                    });
                    writeContract(
                      WriteContractWithdrawProceedsVariables,
                      {
                        onError: (error) => {
                          console.log(error.message ?? error.shortMessage);
                          messageApi.destroy();
                          messageApi.open({
                            type: 'error',
                            content: error.shortMessage,
                          });
                        },
                        onSuccess: async (hashWithdrawProceeds) => { await handleWithdrawSuccess(hashWithdrawProceeds) }
                      }
                    );
                  }}
                >
                  Withdraw
                </Button>
              ) : (
                <div> 
                  <h1 className=" text-2xl font-mono font-bold text-blue-400">
                    No proceeds detected
                  </h1>
                </div>
              )}
            </div>
          )}        
        </div>
      </div>
    </>
  );
}
