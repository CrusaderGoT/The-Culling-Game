import {
    aPlayerOptions,
    createPlayerMutation,
    deletePlayerMutation,
    editPlayerMutation,
    myPlayerOptions,
    myPlayerQueryKey,
    upgradePlayerMutation,
} from "@/api/client/@tanstack/react-query.gen";
import { getAPIErrorMessage } from "@/components/ui/display-api-error";
import { authHeader } from "@/lib/constants/AUTHCONSTANTS";
import { queryClient } from "@/lib/query-client/get-query-client";
import { notifications } from "@mantine/notifications";
import { useMutation, useQueries, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

export const useCreatePlayer = (token: string | undefined) => {
    const mutation = useMutation({
        ...createPlayerMutation({
            headers: authHeader(token),
        }),
        onError: (error) => {
            notifications.show({
                message: `An error occurred while creating player -> ${getAPIErrorMessage(
                    error
                )}`,
                color: "red",
            });
        },
        onSuccess: (player) => {
            notifications.show({
                message: `player ${player.name} created successfully`,
                color: "green",
            });
            queryClient.invalidateQueries({
                queryKey: [{ id: myPlayerQueryKey()[0]._id }],
            });
        },
    });

    return mutation;
};

export const useCurrentPlayer = (token: string | undefined) => {
    const query = useQuery({
        ...myPlayerOptions({
            headers: authHeader(token),
        }),
        refetchOnWindowFocus: false, // to avoid unwanted refetch
        enabled: !!token, // run only if token is available
        staleTime: Infinity
    });

    return query;
};

export const useGetPlayer = (
    token: string,
    playerId: number,
    alive: boolean = true
) => {
    const query = useQuery({
        ...aPlayerOptions({
            headers: authHeader(token),
            path: { player_id: playerId },
            query: { alive: alive },
        }),
        enabled: !!token, // run only if token is available
    });

    return query;
};

// Custom hook for fetching multiple players
export const useGetMatchPlayers = (
    token: string | undefined,
    playerIds: number[]
) => {
    // Filter out any invalid IDs (0, null, undefined)
    const validPlayerIds = playerIds.filter((id) => id && id !== 0);

    // Use TanStack's useQueries to fetch multiple players in parallel
    const playerQueries = useQueries({
        queries: validPlayerIds.map((playerId) => ({
            ...aPlayerOptions({
                headers: authHeader(token),
                path: { player_id: playerId },
                query: { alive: false }, // get even dead player
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
                isFetched: results.some((result) => result.isFetched),

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

export const useEditPlayer = (token: string | undefined) => {
    const mutation = useMutation({
        ...editPlayerMutation({
            headers: authHeader(token),
        }),
        onError: (error) => {
            notifications.show({
                message: `An error occurred while editing player detail(s) -> ${getAPIErrorMessage(
                    error
                )}`,
                color: "red",
            });
        },
        onSuccess: () => {
            notifications.show({
                message: `player detail(s) edited successfully`,
                color: "green",
            });
            queryClient.invalidateQueries({
                queryKey: [myPlayerQueryKey()],
            });
        },
    });

    return mutation;
};

export const useDeletePlayer = (token: string | undefined) => {
    const router = useRouter();

    const mutation = useMutation({
        ...deletePlayerMutation({
            headers: authHeader(token),
        }),
        onError: (error) => {
            notifications.show({
                message: `An error occurred while deleting player -> ${getAPIErrorMessage(
                    error
                )}`,
                color: "yellow",
            });
        },
        onSuccess: () => {
            notifications.show({
                message: `player deleted successfully`,
                color: "red",
            });
            queryClient.invalidateQueries({
                queryKey: [myPlayerQueryKey()],
            });
            router.push("/match");
        },
    });

    return mutation;
};

export const useUpgradePlayer = (token: string | undefined) => {
    const mutation = useMutation({
        ...upgradePlayerMutation({
            headers: authHeader(token),
        }),
        onError: (error) => {
            notifications.show({
                message: `An error occurred while upgrading player -> ${getAPIErrorMessage(
                    error
                )}`,
                color: "yellow",
            });
        },
        onSuccess: () => {
            notifications.show({
                message: `player's grade upgraded successfully`,
                color: "green",
            });
            queryClient.invalidateQueries({
                queryKey: [myPlayerQueryKey()],
            });
        },
    });

    return mutation;
};
