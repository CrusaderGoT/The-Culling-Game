import {
    bindindVowMutation,
    domainExpansionMutation,
    simpleDomainMutation,
} from "@/api/client/@tanstack/react-query.gen";

import { getAPIErrorMessage } from "@/components/ui/display-api-error";
import { notifications } from "@mantine/notifications";
import { useMutation } from "@tanstack/react-query";
import { authHeader } from "../constants/AUTHCONSTANTS";

export const useDomainExpansion = (token: string) => {
    const mutation = useMutation({
        ...domainExpansionMutation({
            headers: authHeader(token),
        }),
        onSuccess: () => {
            notifications.show({
                message: "Domain Activated",
                color: "black",
            });
        },
        onError: (err) => {
            notifications.show({
                message: `Domain Failed -> ${getAPIErrorMessage(err)}`,
                color: "white",
            });
        },
    });
    return mutation;
};

export const useSimpleDomain = (token: string) => {
    const mutation = useMutation({
        ...simpleDomainMutation({
            headers: authHeader(token),
        }),
        onSuccess: () => {
            notifications.show({
                message: "Simple Domain Activated",
                color: "white",
            });
        },
        onError: (err) => {
            notifications.show({
                message: `Simple Domain Failed -> ${getAPIErrorMessage(err)}`,
                color: "black",
            });
        },
    });
    return mutation;
};

export const useBindingVow = (token: string) => {
    const mutation = useMutation({
        ...bindindVowMutation({
            headers: authHeader(token),
        }),
        onSuccess: () => {
            notifications.show({
                message: "Binding Vow Activated",
                color: "charcoal",
            });
        },
        onError: (err) => {
            notifications.show({
                message: `Binding Vow Failed -> ${getAPIErrorMessage(err)}`,
                color: "lime",
            });
        },
    });
    return mutation;
};
