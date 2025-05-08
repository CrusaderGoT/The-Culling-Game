import pluginQuery from "@tanstack/eslint-plugin-query";

const config = [
    ...pluginQuery.configs["flat/recommended"],
    // Any other config...
];

export default config;
