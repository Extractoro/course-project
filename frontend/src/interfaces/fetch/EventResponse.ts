export interface EventData {
    event_id: number;
    event_name: string;
    event_date: string;
    category_id: number;
    description: string | null;
    ticket_price: number;
    isAvailable: boolean;
    available_tickets: number;
    venue_id: number;
    venue_name: string;
    city: string;
    address: string;
    capacity: number;
    capacity_event?: number
}

export interface EventResponse {
    status: number;
    success: boolean;
    data: EventData[];
}
