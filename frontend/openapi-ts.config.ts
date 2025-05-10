import { defineConfig } from "@hey-api/openapi-ts";

export default defineConfig({
    input: `${process.env.BACKEND_HOST}/openapi.json` || "http://localhost:8000/openapi.json",
    output: {
        format: "prettier",
        lint: "eslint",
        path: "api/client",
    },
    plugins: [
        {
            name: "@hey-api/client-next",
            runtimeConfigPath: "./api/hey-api.ts",
        },
        {
            name: "@hey-api/sdk",
            asClass: true,
        },
        {
            name: "@hey-api/typescript",
            enums: "javascript",
        },
        "zod",
        "@tanstack/react-query",
    ],
    watch: false, // true to keep check for changes to fastapi openapi specs
});
