import { getLastestMatchOptions } from "@/api/client/@tanstack/react-query.gen";
import { authHeader } from "@/lib/constants/AUTHCONSTANTS";
import { useQuery } from "@tanstack/react-query";

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
