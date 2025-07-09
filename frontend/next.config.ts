import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    /* config options here */
    experimental: {
        optimizePackageImports: [
            "@mantine/core",
            "@mantine/hooks",
            "@tabler/icons-react",
            "recharts",
            "@mantine/charts",
            "@mantine/form",
            "@mantine/notifications",
            "@mantine/nprogress",
            "clsx",
            "dayjs",
        ],
    },
    crossOrigin: "use-credentials",
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "res.cloudinary.com",
                pathname: "/**",
            },
        ],
    },
};

export default nextConfig;
