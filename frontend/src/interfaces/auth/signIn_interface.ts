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
        role: 'admin' | 'user';
    }
}
