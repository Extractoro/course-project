export interface AdminRequestInterface {
    venue_name: string;
    address: string;
    city: string;
    capacity: number;
    event_id?: number;
    event_name: string;
    event_date: string;
    category: string;
    description?: string | null;
    ticket_price: number;
    available_tickets: number;
}

export interface AdminResponseInterface {
    status: number;
    success: boolean;
    message: string;
    eventId?: number;
    venueId?: number;
}