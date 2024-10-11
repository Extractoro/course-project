export interface ForgetPasswordRequest {
    email: string;
}

export interface ForgetPasswordResponse {
    status: number;
    success: boolean;
    message: string;
    results: {
        token: string;
    }
}
