export interface EventData {
    event_id: number;
    event_name: string;
    event_date: string;
    category: string;
    description: string | null;
    ticket_price: number;
    available_tickets: number;
    venue_id: number;
    venue_name: string;
    city: string;
    address: string;
    capacity: number;
}

export interface EventResponse {
    status: number;
    success: boolean;
    data: EventData[];
}
