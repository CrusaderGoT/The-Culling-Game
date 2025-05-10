import type { CreateClientConfig } from "@/api/client/client.gen";

export const createClientConfig: CreateClientConfig = (config) => ({
    ...config,
    baseUrl: "https://the-culling-games.up.railway.app",
});
