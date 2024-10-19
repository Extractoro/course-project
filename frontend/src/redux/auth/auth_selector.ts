import { RootState } from "../store";

export const selectAuthToken = (state: RootState) => state?.auth.token;
export const selectUserRole = (state: RootState) => state?.auth.role;
