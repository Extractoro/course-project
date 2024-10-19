export interface UserTicketsRequest {
    user_id: number
}

export interface UserTicketsResponse {
    status: number;
    success: boolean;
    message?: string;
    data: UserTicketsData[];
}

export interface UserTicketsData {
    ticket_id: number,
    event_id: number,
    purchase_date: string,
    ticket_status: 'booked' | 'paid',
    event_name: string,
    event_date: string,
    ticket_price: number
}