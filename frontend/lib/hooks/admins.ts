import { currentAdminOptions } from "@/api/client/@tanstack/react-query.gen";
import { authHeader } from "@/lib/constants/AUTHCONSTANTS";
import { useQuery } from "@tanstack/react-query";

export const useCurrentAdmin = (token: string, tokenError?: boolean) => {
    const query = useQuery({
        ...currentAdminOptions({
            headers: authHeader(token),
        }),
        enabled: !!token && !tokenError, // run only if token is available
    });

    return query;
};
