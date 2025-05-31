export const tokenNames = {
    access: "access_token",
    refresh: "resfresh_token",
};

export function authHeader(token: string) {
    const tokenObj = { Authorization: `Bearer ${token}` };
    return tokenObj;
}
