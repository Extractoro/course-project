import {createApi, fetchBaseQuery} from "@reduxjs/toolkit/query/react";
import Cookies from "js-cookie";
import {UserRequest, UserRequestId, UsersResponse} from "../../interfaces/users/UsersResponse.ts";

export const usersApi = createApi({
    reducerPath: 'usersApi',
    baseQuery: fetchBaseQuery({
        baseUrl: 'https://course-project-3f21a753c743.herokuapp.com',
        prepareHeaders: (headers) => {
            const token = Cookies.get("token");
            if (token) {
                headers.set('authorization', `Bearer ${token}`);
            }
            return headers;
        }
    }),
    tagTypes: ['users'],
    endpoints: (builder) => ({
        currentUser: builder.query<UsersResponse, UserRequestId>({
            query: body => ({
                url: `/user/current/${body?.userId}`,
                method: 'GET',
            }),
        }),
        updateUser: builder.mutation<UsersResponse, UserRequest>({
            query: (body) => ({
                url: `/user/update_user/${body.user_id}`,
                method: 'PUT',
                body
            }),
        })
    })
})

export const {
    useCurrentUserQuery,
    useUpdateUserMutation
} = usersApi;