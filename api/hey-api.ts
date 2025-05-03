import type { CreateClientConfig } from "@/api/client/client.gen";
import Auth from "@/lib/Auth";

export const createClientConfig: CreateClientConfig = (config) => ({
    ...config,
    auth: async () => Auth(),
    baseUrl: process.env.BACKEND_HOST,
});
