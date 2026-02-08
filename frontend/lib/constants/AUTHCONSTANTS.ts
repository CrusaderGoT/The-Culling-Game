export const tokenNames = {
    access: "access_token",
    refresh: "resfresh_token",
};

export function authHeader(token: string | undefined) {
    const tokenObj = { Authorization: `Bearer ${token}` };
    return tokenObj;
}
