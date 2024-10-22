export interface SignInRequest {
    email: string;
    password: string;
}

export interface SignInResponse {
    status: number;
    success: boolean;
    message: string;
    results: {
        token: string;
        user_id: number
        role: 'admin' | 'user';
    }
}
