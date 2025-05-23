import {
    getLastestMatchOptions,
    voteMutation,
} from "@/api/client/@tanstack/react-query.gen";
import { authHeader } from "@/lib/constants/AUTHCONSTANTS";
import { notifications } from "@mantine/notifications";
import { useMutation, useQuery } from "@tanstack/react-query";

export const useLatestMatch = (token: string, ongoing: boolean = false) => {
    const query = useQuery({
        ...getLastestMatchOptions({
            query: { ongoing: ongoing },
            headers: authHeader(token),
        }),
        enabled: !!token, // run only if token is available
    });
    return query;
};

export const useCastVote = (token: string) => {
    const mutation = useMutation({
        ...voteMutation({
            headers: authHeader(token),
        }),
        onError() {
            notifications.show({
                message: "Error Casting Vote(s)",
                color: "red",
            });
        },
        onSuccess(data) {
            if (data.extra_info) {
                data.extra_info.forEach((msg) => {
                    notifications.show({
                        message: `${msg}`,
                        autoClose: false,
                        color: "green",
                    });
                });
            }

            if (data.votes.length < 1) {
                notifications.show({
                    message: `${data.message}`,
                    autoClose: false,
                    color: "yellow",
                });
            } else {
                notifications.show({
                    message: `${data.message}`,
                    autoClose: false,
                    color: "green",
                });
            }
        },
    });
    return mutation;
};
