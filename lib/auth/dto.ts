import "server-only";

import { UserInfo } from "@/api/client";


// examples

function canSeeUsername(viewer: UserInfo) {
    return true;
}

function canSeePhoneNumber(viewer: UserInfo, team: string) {
    return viewer.admin || team === viewer.country;
}
