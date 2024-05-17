/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: false,
    swcMinify: true,
    images: {
        loader: "akamai",
        path: "",
        domains: ["cdn.jsdelivr.net"],
    },
    webpack: (config) => {
        config.resolve.fallback = { fs: false, net: false, tls: false };
        config.externals.push("pino-pretty", "lokijs", "encoding");
        return config;
    },
    output: "export",
};

export default nextConfig;