"use client";

import {
    createTokenMutation,
    createUserMutation,
    currentUserOptions,
    myPlayerOptions,
} from "@/api/client/@tanstack/react-query.gen";

import { useMutation, useQuery } from "@tanstack/react-query";

import { notifications } from "@mantine/notifications";
import { createSession } from "../auth/session";

export const useCreateUser = () => {
    const mutation = useMutation({
        ...createUserMutation(),
        onError: (error) => {
            console.log(JSON.stringify(error.detail));
            notifications.show({
                message: "An error occurred while creating your account.",
                color: "red",
            });
        },
    });

    return mutation;
};

export const useLoginUser = () => {
    const mutation = useMutation({
        ...createTokenMutation(),
        onError: (error) => {
            console.log(JSON.stringify(error));
            notifications.show({
                message: "An error occurred during logging in",
                color: "red",
            });
        },
        onSuccess: async (token) => {
            await createSession(token);
            notifications.show({
                message: "login successful",
                color: "green",
            });
        },
    });

    return mutation;
};

export const useCurrentUser = (token: string) => {
    const query = useQuery({
        ...currentUserOptions({
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }),
    });

    return query;
};

export const useCurrentPlayer = (token: string) => {
    const query = useQuery({
        ...myPlayerOptions({
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }),
    });

    return query;
};
