import {createApi, fetchBaseQuery} from "@reduxjs/toolkit/query/react";
import Cookies from "js-cookie";
import {TicketsData, TicketsResponse} from "../../interfaces/tickets/TicketsResponse.ts";

export const ticketsApi = createApi({
    reducerPath: 'ticketsApi',
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
    tagTypes: ['tickets'],
    endpoints: (builder) => ({
        bookTickets: builder.mutation<TicketsResponse, TicketsData>({
            query: ({event_id, user_id, quantity}) => ({
                url: '/tickets/book_tickets',
                method: 'POST',
                body: {event_id, user_id, quantity}
            }),
        }),
        returnTickets: builder.mutation<TicketsResponse, TicketsData>({
            query: body => ({
                url: '/tickets/return_tickets',
                method: 'POST',
                body
            }),
        })
    })
})

export const {
    useBookTicketsMutation,
    useReturnTicketsMutation
} = ticketsApi;