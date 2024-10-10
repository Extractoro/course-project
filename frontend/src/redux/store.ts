import { configureStore } from '@reduxjs/toolkit'
import {authApi} from "./auth/auth_api.ts";


export const store = configureStore({
    reducer: {
        [authApi.reducerPath]: authApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(authApi.middleware),
    devTools: process.env.NODE_ENV === 'development',
})