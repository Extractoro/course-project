import {createSlice, PayloadAction} from "@reduxjs/toolkit";
import {SignInResponse} from "../../interfaces/auth/signIn_interface.ts";
import {authApi} from "./auth_api.ts";

interface AuthState {
    token: string | null;
    role: 'admin' | 'user' | null;
    userId: number | null;
}

const roleFromStorage = localStorage.getItem('role');
const userIdFromStorage = localStorage.getItem('userId');

const initialState: AuthState = {
    token: null,
    role: roleFromStorage ? (roleFromStorage as 'admin' | 'user') : null,
    userId: userIdFromStorage ? parseInt(userIdFromStorage) : null,
};

const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder.addMatcher(authApi.endpoints.signIn.matchFulfilled, (state, { payload }: PayloadAction<SignInResponse>) => {
            const token = payload?.results?.token || null;
            const role = payload?.results?.role || null;
            const userId = payload?.results?.user_id || null;

            state.token = token;
            state.role = role;
            state.userId = userId;

            if (role) localStorage.setItem('role', role);
            if (userId !== null) localStorage.setItem('userId', userId.toString());
        });

        builder.addMatcher(authApi.endpoints.logout.matchFulfilled, (state) => {
            state.token = null;
            state.role = null;
            state.userId = null;

            localStorage.removeItem('role');
            localStorage.removeItem('userId');
        });
    }
});

export default authSlice.reducer;