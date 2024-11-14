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
    isAvailable: boolean;
    isRecurring: boolean;
    frequency: string;
    repeat_interval: number;
    start_date: string;
    end_date: string;
}

export interface AdminDeleteRequestInterface {
    event_id: number;
}

export interface AdminResponseInterface {
    status: number;
    success: boolean;
    message: string;
    eventId?: number;
    venueId?: number;
}

export interface AdminGetAllTicketsInterface {
    status: number;
    success: boolean;
    data: AdminTicketDataInterface[]
}

export interface AdminTicketDataInterface {
    ticket_id: number,
    event_id: number,
    user_id: number,
    purchase_date: Date,
    ticket_status: 'booked' | 'paid',
    event_name: string,
    event_date: Date,
    ticket_price: number,
    category_id: number,
    category_name: string,
    user_firstname: string,
    user_lastname: string,
    email: string
}

export interface AdminGetAllUsersInterface {
    status: number;
    success: boolean;
    data: AdminUserDataInterface[]
}

export interface AdminUserDataInterface{
    user_firstname: string,
    user_lastname: string,
    email: string,
    verify: 0 | 1
}