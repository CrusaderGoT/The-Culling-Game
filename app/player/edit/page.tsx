"use client";

import { Button } from "@/components/ui/button";
import { useMyPlayerQuery } from "@/lib/custom-hooks/player-queries";
import { LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { EditPlayerForm } from "./EditPlayerForm";

export default function EditPlayerPage() {
    const router = useRouter();

    const accessToken = localStorage.getItem("access_token");

    const {
        data: myPlayer,
        error,
        refetch,
        isPending,
        isSuccess,
    } = useMyPlayerQuery(accessToken);

    return (
        <div className="m-6">
            {isPending && (
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
                            <Button onClick={() => refetch()}>Retry</Button>
                        </div>
                    )}

                    {error.detail && (
                        <div className="flex flex-col items-center">
                            <p>{error.detail}</p>{" "}
                            <Button
                                onClick={(e) => {
                                    e.currentTarget.disabled;
                                    router.push("/user/login");
                                }}
                            >
                                Login
                            </Button>
                        </div>
                    )}

                    {typeof error === "string" && (
                        <div className="flex flex-col items-center">
                            <p>{error}</p>
                            <Button
                                onClick={() => router.push("/player/create")}
                            >
                                Create Player
                            </Button>
                        </div>
                    )}
                </div>
            )}

            {myPlayer && isSuccess && (
                <div className="flex flex-col">
                    <h2 className="text-lg font-bold self-center">
                        Edit Your Player Here
                    </h2>
                    <EditPlayerForm player={myPlayer} />
                </div>
            )}
        </div>
    );
}
