import type { CreateClientConfig } from "@/api/client/client.gen";

export const createClientConfig: CreateClientConfig = (config) => ({
    ...config,
    baseUrl: process.env.BACKEND_HOST,
});
