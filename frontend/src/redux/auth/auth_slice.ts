import {createSlice, PayloadAction} from "@reduxjs/toolkit";
import {SignInResponse} from "../../interfaces/auth/signIn_interface.ts";
import {authApi} from "./auth_api.ts";

interface AuthState {
    token: string | null;
    role: 'admin' | 'user' | null;
}

const tokenFromStorage = localStorage.getItem('token');
const roleFromStorage = localStorage.getItem('role');

const initialState: AuthState = {
    token: tokenFromStorage ? tokenFromStorage : null,
    role: roleFromStorage ? (roleFromStorage as 'admin' | 'user') : null,
};

const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder.addMatcher(authApi.endpoints.signIn.matchFulfilled, (state, { payload }: PayloadAction<SignInResponse>) => {
            const token = payload?.results?.token || null;
            const role = payload?.results?.role || null;

            state.token = token;
            state.role = role;

            if (token) localStorage.setItem('token', token);
            if (role) localStorage.setItem('role', role);
        });

        builder.addMatcher(authApi.endpoints.logout.matchFulfilled, (state) => {
            state.token = null;
            state.role = null;

            localStorage.removeItem('token');
            localStorage.removeItem('role');
        });
    }
});

export default authSlice.reducer;
