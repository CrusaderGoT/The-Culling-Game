import { defineConfig } from "@hey-api/openapi-ts";

export default defineConfig({
    input: {
        path:
            process.env.NODE_ENV === "production"
                ? "https://the-culling-games.up.railway.app/openapi.json"
                : "http://localhost:8000/openapi.json",
        watch: true, // true to keep check for changes to fastapi openapi specs
    },

    output: {
        path: "apis/client",
        postProcess: ["eslint", "prettier"],
    },
    plugins: [
        {
            name: "@hey-api/client-next",
            runtimeConfigPath: "@/apis/hey-api",
        },
        {
            name: "@hey-api/sdk",
            operations: {
                strategy: "byTags",
            },
            auth: true,
            validator: { request: true },
        },
        {
            name: "@hey-api/typescript",
            enums: "javascript",
        },
        {
            name: "zod",
        },
        {
            name: "@tanstack/react-query",
            queryOptions: {
                meta(operation) {
                    return { id: operation.id };
                },
            },
        },
    ],
});
