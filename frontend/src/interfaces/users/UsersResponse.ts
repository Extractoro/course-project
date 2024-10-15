export interface UsersResponse {
    status: number;
    success: boolean;
    message?: string;
    results?: UserData[];
}

export interface UserData {
    user_id: number,
    user_firstname: string,
    user_lastname: string,
    email: string,
    phone: string,
    role: 'user' | 'admin',
    verify: boolean
}