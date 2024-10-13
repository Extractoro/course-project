export interface EventData {
    event_id: number;
    event_name: string;
    event_date: string;
    category_id: number;
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

// city: string;
// event_date: string;
// venue_name: string;

// category: string;
// ticket_price: number;
// available_tickets: number;
// address: string;