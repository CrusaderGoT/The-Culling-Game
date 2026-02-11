import {
    getLastestMatchOptions,
    voteMutation,
} from "@/api/client/@tanstack/react-query.gen";
import { getAPIErrorMessage } from "@/components/ui/display-api-error";
import { authHeader } from "@/lib/constants/AUTHCONSTANTS";
import { notifications } from "@mantine/notifications";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useSocketEmit } from "../contexts/socket-context-provider";

export const useLatestMatch = (
    token: string | undefined,
    ongoing: boolean = false
) => {
    const query = useQuery({
        ...getLastestMatchOptions({
            query: { ongoing: ongoing },
            headers: authHeader(token),
        }),
        enabled: !!token, // run only if token is available
    });
    return query;
};

export const useCastVote = (token: string | undefined) => {
    const { emit, isConnected } = useSocketEmit();

    const mutation = useMutation({
        ...voteMutation({
            headers: authHeader(token),
        }),
        onError(e) {
            notifications.show({
                message: `Error Casting Vote(s) -> ${getAPIErrorMessage(e)}`,
                color: "red",
            });
        },
        onSuccess(data) {
            // send socket emit to server, if connected
            if (isConnected) {
                emit("vote_casted", { match_id: data.extra_info.match_id });
            }

            if (data.extra_info && !data.extra_info.match_id) {
                Object.values(data.extra_info).forEach((msg) => {
                    notifications.show({
                        message: `${msg}`,
                        color: "green",
                    });
                });
            }

            notifications.show({
                message: `${data.message}`,
                color: data.votes.length < 1 ? "yellow" : "green",
            });
        },
    });
    return mutation;
};
