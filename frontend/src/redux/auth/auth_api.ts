import {createApi, fetchBaseQuery} from "@reduxjs/toolkit/query/react";
import {SignUpRequest, SignUpResponse} from "../../interfaces/auth/signUp_interface.ts";
import {SignInRequest, SignInResponse} from "../../interfaces/auth/signIn_interface.ts";
import Cookies from 'js-cookie';
import {LogOutResponse} from "../../interfaces/auth/logOut_interface.ts";
import {ForgetPasswordRequest, ForgetPasswordResponse} from "../../interfaces/auth/forgetPassword_interface.ts";

export const authApi = createApi({
    reducerPath: 'authApi',
    baseQuery: fetchBaseQuery({ baseUrl: 'http://localhost:3000' }),
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
            async onQueryStarted(_, {queryFulfilled}) {
                try {
                    const {data} = await queryFulfilled;
                    const token = data?.results?.token;

                    if (token) {
                        const expirationDate = new Date();
                        expirationDate.setTime(expirationDate.getTime() + 4 * 60 * 60 * 1000);

                        Cookies.set('token', token, {expires: expirationDate, secure: true, sameSite: 'Strict'});
                    }
                } catch (error) {
                    console.error('Ошибка при сохранении токена в куки:', error);
                }
            },
        }),
        forgetPassword: builder.mutation<ForgetPasswordResponse, ForgetPasswordRequest>({
            query: body => ({
                url: '/auth/forget_password',
                method: 'POST',
                body,
            }),
            invalidatesTags: ['auth'],
        }),
        logout: builder.mutation<LogOutResponse, void>({
            query: () => ({
                url: '/auth/logout',
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${Cookies.get('token')}`,
                },
            }),
            async onQueryStarted(_, { queryFulfilled }) {
                try {
                    await queryFulfilled;
                    Cookies.remove('token', { secure: true, sameSite: 'Strict' });
                } catch (error) {
                    console.error('Error:', error);
                }
            },
            invalidatesTags: ['auth'],
        }),
    }),
})

export const {
    useSignUpMutation,
    useSignInMutation,
    useLogoutMutation,
    useForgetPasswordMutation,
} = authApi;