import type { CreateClientConfig } from "@/api/client/client.gen";

export const createClientConfig: CreateClientConfig = (config) => ({
    ...config,
    baseUrl: process.env.NEXT_PUBLIC_BACKEND_HOST || "https://the-culling-games.up.railway.app",
});
