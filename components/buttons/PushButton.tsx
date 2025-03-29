"use client";

import { useRouter } from "next/navigation";

import { Button, ButtonProps } from "@/components/ui/button";

type PushButtonProp = {
    pushTo: string;
    label: string;
} & ButtonProps;

export function PushButton({ pushTo: href, label, ...props }: PushButtonProp) {
    const router = useRouter();

    return (
        <Button {...props} onClick={() => router.push(href)}>
            {label}
        </Button>
    );
}
