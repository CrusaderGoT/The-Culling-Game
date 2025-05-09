import {
    createTokenMutation,
    createUserMutation,
    currentUserOptions,
} from "@/api/client/@tanstack/react-query.gen";

import { useMutation, useQuery } from "@tanstack/react-query";

import { notifications } from "@mantine/notifications";

export const useCreateUser = () => {
    const mutation = useMutation({
        ...createUserMutation(),
        onError: (error) => {
            console.log(
                "An error occurred while creating your account.",
                error
            );
            notifications.show({
                title: "An error occurred while creating your account.",
                message: error.detail?.map((d) => d.msg),
            });
        },
    });

    return mutation;
};

export const useLoginUser = () => {
    const mutation = useMutation({
        ...createTokenMutation(),
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
