import type { CreateClientConfig } from "@/apis/client/client.gen";

export const createClientConfig: CreateClientConfig = (config) => ({
    ...config,
    baseUrl:
        process.env.NODE_ENV === "production"
            ? "https://the-culling-games.up.railway.app"
            : "http://localhost:8000",
});
