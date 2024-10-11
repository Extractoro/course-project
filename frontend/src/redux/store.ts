import { configureStore } from '@reduxjs/toolkit'
import {authApi} from "./auth/auth_api.ts";
import {fetchApi} from "./fetch/fetch_api.ts";

export const store = configureStore({
    reducer: {
        [authApi.reducerPath]: authApi.reducer,
        [fetchApi.reducerPath]: fetchApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(authApi.middleware, fetchApi.middleware),
    devTools: process.env.NODE_ENV === 'development',
});