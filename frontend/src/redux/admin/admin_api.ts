import {createApi, fetchBaseQuery} from "@reduxjs/toolkit/query/react";
import Cookies from "js-cookie";
import {
    AdminRequestInterface,
    AdminResponseInterface
} from "../../interfaces/admin/admin_interface.ts";

export const adminApi = createApi({
    reducerPath: 'adminApi',
    baseQuery: fetchBaseQuery({
        baseUrl: 'http://localhost:3000',
        prepareHeaders: (headers) => {
            const token = Cookies.get("token");
            if (token) {
                headers.set('authorization', `Bearer ${token}`);
            }
            return headers;
        }
    }),
    tagTypes: ['admin'],
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
        deleteEvent: builder.mutation<AdminResponseInterface, AdminRequestInterface>({
            query: body => ({
                url: `/admin/delete_event/${body.event_id}`,
                method: 'DELETE',
                body
            }),
        }),
    })
})

export const {
    useCreateEventMutation,
    useUpdateEventMutation,
    useDeleteEventMutation,
} = adminApi;