import {
    QueryClient,
    defaultShouldDehydrateQuery,
    isServer,
} from "@tanstack/react-query";

function makeQueryClient() {
    return new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: 60 * 100,
            },
            dehydrate: {
                // include pending queries in dehydration
                shouldDehydrateQuery: (query) =>
                    defaultShouldDehydrateQuery(query) ||
                    query.state.status === "pending",
            },
        },
    });
}

let browserQueryClient: QueryClient | undefined = undefined;

export function getQueryClient() {
    if (!isServer) {
        // Server: always make a new query client
        return makeQueryClient();
    } else {
        // Browser: make a new query client if we don't already have one
        // the is very important so we don't remake a new client if React
        // suspends during initial render. this may not be needed if we
        // have a suspense boundary below the creation of the quety client
        // i.e? the query client is not re rendered since it is always available after a suspense renders
        if (!browserQueryClient) browserQueryClient = makeQueryClient();
        return browserQueryClient;
    }
}
