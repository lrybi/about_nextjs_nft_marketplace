import { Inter } from "next/font/google";
import "./globals.css";
import "@rainbow-me/rainbowkit/styles.css";
import Providers from "./providers";
import Navbar from '@/components/Navbar';


import { ApolloWrapper } from "./apollo-wrapper";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "NFT Marketplace",
  description: "NFT Marketplace",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <ApolloWrapper>
            <Navbar />
            {children}
          </ApolloWrapper>
        </Providers>
      </body>
    </html>
  );
}
