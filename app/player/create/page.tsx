import { currentUserOptions } from "@/api/client/@tanstack/react-query.gen";
import { PushButton } from "@/components/buttons/PushButton";
import { CreatePlayerForm } from "@/components/player/forms/CreatePlayerForm";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { LoaderCircle } from "lucide-react";

export default function CreatePlayerPage() {
    // get access token
    const token = localStorage.getItem("access_token");
    // check if player exists for this user, and if user exist
    const {
        data: currentUser,
        error,
        isPending,
        isFetching,
        isSuccess,
        refetch,
    } = useQuery({
        ...currentUserOptions({
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }),
    });
    return (
        <div className="m-6">
            {(isPending || isFetching) && (
                <div className="w-full h-dvh grid place-content-center fixed inset-0">
                    <div className="flex gap-1">
                        <LoaderCircle className="animate-spin" /> Loading...
                    </div>
                </div>
            )}

            {error && (
                <div className="w-full h-dvh grid place-content-center fixed inset-0">
                    {error.message && error instanceof Error && (
                        <div className="flex flex-col items-center">
                            <p>
                                {error.message}, make sure you have good
                                internet connection.
                            </p>
                            <Button
                                className="max-w-xs w-full"
                                onClick={() => refetch()}
                            >
                                Retry
                            </Button>
                        </div>
                    )}

                    {error.detail && (
                        <div className="flex flex-col items-center">
                            <p>{error.detail}</p>
                            <PushButton
                                pushTo="/user/login"
                                label="Login"
                                className="max-w-xs w-full"
                            />
                        </div>
                    )}

                    {typeof error === "string" && (
                        <div className="flex flex-col items-center">
                            <p>{error}</p>
                            <PushButton
                                pushTo="/user/edit"
                                label="Edit Player"
                                className="max-w-xs w-full"
                            />
                        </div>
                    )}
                </div>
            )}

            {currentUser && isSuccess ? (
                !currentUser.player ? (
                    <div className="flex flex-col">
                        <h2 className="text-lg font-bold self-center">
                            Create Your Player Here
                        </h2>
                        <CreatePlayerForm user={currentUser} />
                    </div>
                ) : (
                    !isFetching && (
                        <div className="w-full h-dvh grid place-content-center fixed inset-0">
                            <p>Already Have a Player</p>
                            <PushButton
                                pushTo="/player/edit"
                                label="Edit Player"
                            />
                        </div>
                    )
                )
            ) : null}
        </div>
    );
}
