import {createApi, fetchBaseQuery} from "@reduxjs/toolkit/query/react";
import {EventResponse} from "../../interfaces/fetch/EventResponce.ts";
import Cookies from "js-cookie";

export const fetchApi = createApi({
    reducerPath: 'fetchApi',
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
    tagTypes: ['events'],
    endpoints: (builder) => ({
        fetchEvents: builder.query<EventResponse, void>({
            query: () => ({
                url: '/fetch/events',
            }),
        })
    })
})

export const {
    useFetchEventsQuery
} = fetchApi;