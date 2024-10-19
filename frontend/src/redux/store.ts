import { configureStore } from '@reduxjs/toolkit'
import {authApi} from "./auth/auth_api.ts";
import {fetchApi} from "./fetch/fetch_api.ts";
import {ticketsApi} from "./tickets/tickets_api.ts";
import {usersApi} from "./user/users_api.ts";
import authSlice from "./auth/auth_slice.ts";

export const store = configureStore({
    reducer: {
        [authApi.reducerPath]: authApi.reducer,
        auth: authSlice,
        [fetchApi.reducerPath]: fetchApi.reducer,
        [ticketsApi.reducerPath]: ticketsApi.reducer,
        [usersApi.reducerPath]: usersApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(authApi.middleware, fetchApi.middleware, ticketsApi.middleware, usersApi.middleware),
    devTools: process.env.NODE_ENV === 'development',
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;