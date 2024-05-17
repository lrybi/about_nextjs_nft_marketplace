
import { http, createConfig } from '@wagmi/core'
import { mainnet, sepolia, polygon, hardhat } from '@wagmi/core/chains'

export const config = createConfig({
    chains: [mainnet, sepolia, polygon, hardhat],
    transports: {
        [mainnet.id]: http(), 
        [sepolia.id]: http(),
        [polygon.id]: http(),
        [hardhat.id]: http(),
    },
})