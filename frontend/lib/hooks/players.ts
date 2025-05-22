import {
    aPlayerOptions,
    createPlayerMutation,
    currentUserQueryKey,
    myPlayerOptions,
    myPlayerQueryKey,
} from "@/api/client/@tanstack/react-query.gen";
import { authHeader } from "@/lib/constants/AUTHCONSTANTS";
import { queryClient } from "@/lib/query-client/get-query-client";
import { notifications } from "@mantine/notifications";
import { useMutation, useQueries, useQuery } from "@tanstack/react-query";

export const useCreatePlayer = (token: string) => {
    const mutation = useMutation({
        ...createPlayerMutation({
            headers: authHeader(token),
        }),
        onError: (error) => {
            console.error(JSON.stringify(error));
            notifications.show({
                message: "An error occurred while creating player",
                color: "red",
            });
        },
        onSuccess: (player) => {
            notifications.show({
                message: `player ${player.name} created successfully`,
                color: "green",
            });
            queryClient.invalidateQueries({
                queryKey: [
                    myPlayerQueryKey({
                        headers: authHeader(token),
                    }),
                    currentUserQueryKey({
                        headers: authHeader(token),
                    }),
                ],
            });
        },
    });

    return mutation;
};

export const useCurrentPlayer = (token: string) => {
    const query = useQuery({
        ...myPlayerOptions({
            headers: authHeader(token),
        }),
        refetchOnWindowFocus: false, // to avoid unwanted refretch
        enabled: !!token, // run only if token is available
    });

    return query;
};

export const useGetPlayer = (token: string, playerId: number) => {
    const query = useQuery({
        ...aPlayerOptions({
            headers: authHeader(token),
            path: { player_id: playerId },
        }),
        refetchOnWindowFocus: false, // to avoid unwanted refretch
        enabled: !!token, // run only if token is available
    });

    return query;
};

// Custom hook for fetching multiple players
export const useGetPlayers = (token: string, playerIds: number[]) => {
    // Filter out any invalid IDs (0, null, undefined)
    const validPlayerIds = playerIds.filter((id) => id && id !== 0);

    // Use TanStack's useQueries to fetch multiple players in parallel
    const playerQueries = useQueries({
        queries: validPlayerIds.map((playerId) => ({
            ...aPlayerOptions({
                headers: authHeader(token),
                path: { player_id: playerId },
            }),
            enabled: !!token && !!playerId, // Only run query if we have both token and playerId
            staleTime: Infinity,
            retry: process.env.NODE_ENV === "development" ? Infinity : 5,
        })),
        combine: (results) => {
            return {
                data: results.map((result) => result.data),
                error: results.some((result) => result.error),
                isPending: results.some((result) => result.isPending),
                isLoading: results.some((result) => result.isLoading),

                // Add refetch functionality for all queries
                refetch: async () => {
                    const refetchPromises = results.map((result) =>
                        result.refetch()
                    );
                    return Promise.all(refetchPromises);
                },
                // Add individual refetch for each player
                refetchPlayer: async (playerId: number) => {
                    const playerIndex = validPlayerIds.indexOf(playerId);
                    if (playerIndex >= 0 && results[playerIndex]) {
                        return results[playerIndex].refetch();
                    }
                    return Promise.reject(
                        new Error(`Player ID ${playerId} not found`)
                    );
                },
                // Add refetch for failed queries only
                refetchFailed: async () => {
                    const failedQueries = results
                        .map((result, index) => ({
                            result,
                            playerId: validPlayerIds[index],
                        }))
                        .filter(({ result }) => result.error);

                    return Promise.all(
                        failedQueries.map(({ result }) => result.refetch())
                    );
                },
                // Return the raw results array for advanced use cases
                rawResults: results,
            };
        },
    });

    return playerQueries;
};
