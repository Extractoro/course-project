export interface TicketsData {
    quantity: number;
    event_id: string;
    user_id: number;
}

export interface TicketsResponse {
    status: number;
    success: boolean;
    message: string;
}
