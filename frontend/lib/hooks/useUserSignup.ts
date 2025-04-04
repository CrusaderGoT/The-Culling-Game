import { createUserMutation } from "@/api/client/@tanstack/react-query.gen";
import { useMutation } from "@tanstack/react-query";

const useUserSignup = () => {
    const mutation = useMutation({
        ...createUserMutation(),
        onError: (error) => {
            console.log(error);
        },
    });

    return mutation;
};
