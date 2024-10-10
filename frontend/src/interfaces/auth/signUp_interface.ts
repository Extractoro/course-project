export interface SignUpRequest {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    password: string;
}

export interface SignUpResponse {
    status: number;
    success: boolean;
    message: string;
}
