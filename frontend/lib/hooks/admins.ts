import {
    createAdminMutation,
    createMatchMutation,
    currentAdminOptions,
    deleteMatchMutation,
    demoSuperuserMutation,
    getLastestMatchQueryKey,
    grantPermissionMutation,
    newPermissionMutation,
    removePermissionMutation,
} from "@/api/client/@tanstack/react-query.gen";
import { getAPIErrorMessage } from "@/components/ui/display-api-error";
import { authHeader } from "@/lib/constants/AUTHCONSTANTS";
import { queryClient } from "@/lib/query-client/get-query-client";
import { notifications } from "@mantine/notifications";
import { useMutation, useQuery } from "@tanstack/react-query";

export const useCurrentAdmin = (token: string, tokenError?: boolean) => {
    const query = useQuery({
        ...currentAdminOptions({
            headers: authHeader(token),
        }),
        enabled: !!token && !tokenError, // run only if token is available
    });

    return query;
};

export const useCreateMatch = (token: string) => {
    const mutation = useMutation({
        ...createMatchMutation({
            headers: authHeader(token),
        }),
        onError: (error) => {
            notifications.show({
                message: `An error occurred while creating match -> ${getAPIErrorMessage(
                    error
                )}`,
                color: "yellow",
            });
        },
        onSuccess: (match) => {
            notifications.show({
                message: `match part ${match.part}: colony ${match.colony.country} started successfully`,
                color: "deepred",
            });
            queryClient.invalidateQueries({
                queryKey: [getLastestMatchQueryKey()],
            });
        },
    });
    return mutation;
};

export const useDeleteMatch = (token: string) => {
    const mutation = useMutation({
        ...deleteMatchMutation({
            headers: authHeader(token),
        }),
        onError: (error) => {
            notifications.show({
                message: `An error occurred while deleting match -> ${getAPIErrorMessage(
                    error
                )}`,
                color: "yellow",
            });
        },
        onSuccess: (match) => {
            notifications.show({
                message: `match part ${match.part}: colony ${match.colony.country} deleted successfully`,
                color: "blue",
            });
            queryClient.invalidateQueries({
                queryKey: [getLastestMatchQueryKey()],
            });
        },
    });
    return mutation;
};

export const useNewPermission = (token: string) => {
    const mutation = useMutation({
        ...newPermissionMutation({
            headers: authHeader(token),
        }),
        onError(error) {
            notifications.show({
                message: `An error occurred while deleting match -> ${getAPIErrorMessage(
                    error
                )}`,
                color: "red",
            });
        },
        onSuccess(data) {
            notifications.show({
                id: "newperms",
                message: `Successfull added ${data.length} permission(s)`,
            });
            notifications.hide("newperms");

            data.forEach((newPerm, index) => {
                notifications.show({
                    id: `${index}`,
                    message: newPerm.name,
                });
                setTimeout(notifications.hide(`${index}`), 500);
            });
        },
    });

    return mutation;
};

export const useCreateAdmin = (token: string) => {
    const mutation = useMutation({
        ...createAdminMutation({
            headers: authHeader(token),
        }),
        onError(error) {
            notifications.show({
                message: `An error occurred -> ${getAPIErrorMessage(error)}`,
                color: "red",
            });
        },
        onSuccess(data) {
            notifications.show({
                message: `Successfull added user ${data.user.username} as an admin`,
                color: "green",
            });
        },
    });

    return mutation;
};

export const useRemovePermission = (token: string) => {
    const mutation = useMutation({
        ...removePermissionMutation({
            headers: authHeader(token),
        }),
        onError(error) {
            notifications.show({
                message: `An error occurred -> ${getAPIErrorMessage(error)}`,
            });
        },
        onSuccess(data) {
            notifications.show({
                message: `Successfully removed permission(s) 
                from admin ${data.user.username}`,
            });
        },
    });

    return mutation;
};

export const useGrantPermission = (token: string) => {
    const mutation = useMutation({
        ...grantPermissionMutation({
            headers: authHeader(token),
        }),
        onError(error) {
            notifications.show({
                message: `An error occurred -> ${getAPIErrorMessage(error)}`,
            });
        },
        onSuccess(data) {
            notifications.show({
                message: `Successfully granted permission(s) 
                to admin ${data.user.username}`,
            });
        },
    });

    return mutation;
};

export const useDemoSuperuser = (token: string) => {
    const mutation = useMutation({
        ...demoSuperuserMutation({
            headers: authHeader(token),
        }),
        onError(error) {
            notifications.show({
                message: `An error occurred -> ${getAPIErrorMessage(error)}`,
            });
        },
        onSuccess(data) {
            notifications.show({
                message: `Successfully granted permission(s) 
                to admin ${data.user.username}`,
            });
        },
    });

    return mutation;
};
