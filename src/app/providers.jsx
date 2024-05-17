"use client"

import React from "react";
import { useState, useEffect } from "react";
    
import { RainbowKitProvider, getDefaultConfig } from "@rainbow-me/rainbowkit";


import { http, WagmiProvider } from "wagmi";

import { mainnet, sepolia, polygon, hardhat } from 'wagmi/chains'
  
const projectId = process.env.NEXT_PUBLIC_PROJECT_ID;

const chains = [mainnet, sepolia, polygon, hardhat];
        
const AppInfo = {
    appName: "My RainbowKit App",
  };

const config = getDefaultConfig({
    appName: 'My RainbowKit App',
    autoConnect: true,
    projectId: projectId,
    chains: [mainnet, sepolia, polygon, hardhat],
    transports: {
        [mainnet.id]: http(), 
        [sepolia.id]: http(),
        [polygon.id]: http(),
        [hardhat.id]: http(),
    },
})

import {
    QueryClientProvider,
    QueryClient,
} from "@tanstack/react-query";

const queryClient = new QueryClient();

const Providers = ({ children }) => {
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);
    return (
        <WagmiProvider config={config}>
            <QueryClientProvider client={queryClient}>
                <RainbowKitProvider
                    chains={chains}
                    appInfo={AppInfo}
                    modalSize="compact"
                >
                    {mounted && children}
                </RainbowKitProvider>
            </QueryClientProvider>
        </WagmiProvider>
    );
};

export default Providers;