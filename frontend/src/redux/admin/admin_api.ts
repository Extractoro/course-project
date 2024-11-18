import {createApi, fetchBaseQuery} from "@reduxjs/toolkit/query/react";
import Cookies from "js-cookie";
import {
    AdminDeleteRequestInterface, AdminGetAllTicketsInterface, AdminGetAllUsersInterface,
    AdminRequestInterface,
    AdminResponseInterface
} from "../../interfaces/admin/admin_interface.ts";

export const adminApi = createApi({
    reducerPath: 'adminApi',
    baseQuery: fetchBaseQuery({
        baseUrl: 'https://course-project-3f21a753c743.herokuapp.com',
        // baseUrl: 'http://localhost:3000',
        prepareHeaders: (headers) => {
            const token = Cookies.get("token");
            if (token) {
                headers.set('authorization', `Bearer ${token}`);
            }
            return headers;
        }
    }),
    tagTypes: ['admin', 'tickets'],
    endpoints: (builder) => ({
        createEvent: builder.mutation<AdminResponseInterface, AdminRequestInterface>({
            query: body => ({
                url: '/admin/create_event',
                method: 'POST',
                body
            }),
        }),
        updateEvent: builder.mutation<AdminResponseInterface, AdminRequestInterface>({
            query: body => ({
                url: `/admin/update_event/${body.event_id}`,
                method: 'PUT',
                body
            }),
        }),
        deleteEvent: builder.mutation<AdminResponseInterface, AdminDeleteRequestInterface>({
            query: body => ({
                url: `/admin/delete_event/${body.event_id}`,
                method: 'DELETE',
            }),
        }),
        getAllTickets: builder.query<AdminGetAllTicketsInterface, void>({
            query: () => ({
                url: `/admin/all_tickets`,
                method: 'GET',
            }),
        }),
        getAllUsers: builder.query<AdminGetAllUsersInterface, void>({
            query: () => ({
                url: `/admin/all_users`,
                method: 'GET',
            }),
        }),
    })
})

export const {
    useCreateEventMutation,
    useUpdateEventMutation,
    useDeleteEventMutation,
    useGetAllTicketsQuery,
    useGetAllUsersQuery,
} = adminApi;