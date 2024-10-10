import {createApi, fetchBaseQuery} from "@reduxjs/toolkit/query/react";
import {SignUpRequest, SignUpResponse} from "../../interfaces/auth/signUp_interface.ts";
import {SignInRequest, SignInResponse} from "../../interfaces/auth/signIn_interface.ts";

export const authApi = createApi({
    reducerPath: 'authApi',
    baseQuery: fetchBaseQuery(
        {
            baseUrl: 'http://localhost:3000',
            // prepareHeaders: (headers, { getState }) => {
            //     const state = getState() as RootState;
            //     const token = state.auth.token;
            //     if(token) {
            //         headers.set('Authorization', `Bearer ${token}`);
            //     }
            //     return headers;
            // }
        },
    ),
    tagTypes: ['auth'],
    endpoints: (builder) => ({
        signUp: builder.mutation<SignUpResponse, SignUpRequest>({
            query: body => ({
                url: '/auth/registration',
                method: 'POST',
                body,
            }),
            invalidatesTags: ['auth'],
        }),
        signIn: builder.mutation<SignInResponse, SignInRequest>({
            query: body => ({
                url: '/auth/login',
                method: 'POST',
                body,
            }),
            invalidatesTags: ['auth'],
        }),
    }),
})

export const {
    useSignUpMutation,
    useSignInMutation,
} = authApi;