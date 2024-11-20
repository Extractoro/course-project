import {createApi, fetchBaseQuery} from "@reduxjs/toolkit/query/react";
import {EventResponse} from "../../interfaces/fetch/EventResponse.ts";
import Cookies from "js-cookie";
import {CategoriesResponse} from "../../interfaces/fetch/CategoryResponse.ts";
import {UserTicketsRequest, UserTicketsResponse} from "../../interfaces/fetch/UserTicketsResponse.ts";

export const fetchApi = createApi({
    reducerPath: 'fetchApi',
    baseQuery: fetchBaseQuery({
        // baseUrl: 'https://course-project-3f21a753c743.herokuapp.com',
        baseUrl: 'http://localhost:3000',
        prepareHeaders: (headers) => {
            const token = Cookies.get("token");
            if (token) {
                headers.set('authorization', `Bearer ${token}`);
            }
            return headers;
        }
    }),
    tagTypes: ['events'],
    endpoints: (builder) => ({
        fetchEvents: builder.query<EventResponse, void>({
            query: () => ({
                url: '/fetch/events',
            }),
        }),
        fetchCategories: builder.query<CategoriesResponse, void>({
            query: () => ({
                url: '/fetch/categories',
            }),
        }),
        fetchUserTickets: builder.query<UserTicketsResponse, UserTicketsRequest>({
            query: (body) => ({
                url: `/fetch/user_tickets/${body?.user_id}`,
                method: 'GET',
            }),
        }),
    })
})

export const {
    useFetchEventsQuery,
    useFetchCategoriesQuery,
    useFetchUserTicketsQuery
} = fetchApi;
