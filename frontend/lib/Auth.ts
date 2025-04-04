import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function Auth() {
    const accessToken = (await cookies()).get("access_token");
    if (!accessToken) {
        redirect("/login");
    }
    return accessToken.value;
}
