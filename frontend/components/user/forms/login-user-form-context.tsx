"use client";

import { createFormContext } from "@mantine/form";

import { z } from "zod";

export const loginUserSchema = z.object({
    username: z
        .string()
        .nonempty({
            error: "Username must be at least 2 characters"
        }),
    password: z
        .string()
        .min(8, {
            error: "Password must be atleast 8 characters"
        }),
});

export type LoginUserType = z.infer<typeof loginUserSchema>;

export const [LoginFormProvider, useLoginFormContext, useLoginForm] =
    createFormContext<LoginUserType>();
