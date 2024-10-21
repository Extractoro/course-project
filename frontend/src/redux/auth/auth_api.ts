import {createApi, fetchBaseQuery} from "@reduxjs/toolkit/query/react";
import {SignUpRequest, SignUpResponse} from "../../interfaces/auth/signUp_interface.ts";
import {SignInRequest, SignInResponse} from "../../interfaces/auth/signIn_interface.ts";
import Cookies from 'js-cookie';
import {LogOutResponse} from "../../interfaces/auth/logOut_interface.ts";
import {ForgetPasswordRequest, ForgetPasswordResponse} from "../../interfaces/auth/forgetPassword_interface.ts";

export const authApi = createApi({
    reducerPath: 'authApi',
    baseQuery: fetchBaseQuery({ baseUrl: 'https://course-project-3f21a753c743.herokuapp.com/' }),
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
        signUpConfirmation: builder.mutation<SignUpResponse, { verificationToken: string }>({
            query: ({verificationToken}) => ({
                url: `/auth/registration_confirm/${verificationToken}`,
                method: 'GET',
            })
        }),
        confirmResend: builder.mutation<SignUpResponse, { email: string }>({
            query: body => ({
                url: '/auth/confirmation_resend',
                method: 'POST',
                body
            })
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
        resetPassword: builder.mutation<SignUpResponse, { resetPasswordToken: string, newPassword: string }>({
            query: body => ({
                url: `/auth/reset_password/${body.resetPasswordToken}`,
                method: 'POST',
                body
            })
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
    useSignUpConfirmationMutation,
    useConfirmResendMutation,
    useSignInMutation,
    useLogoutMutation,
    useForgetPasswordMutation,
    useResetPasswordMutation,
} = authApi;