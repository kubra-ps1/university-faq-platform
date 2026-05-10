export interface User {
    id: number;
    fullName: string;
    email: string;   
    role: 'admin' | 'student'; 
}

export interface LoginCredentials {
    email: string;
    password: string;
}


export interface RegisterFormState {
    fullName: string;
    email: string;
    password: string;
    confirmPassword: string;
    faculty:string;
    department:string;
}


export interface RegisterRequest {
    fullName: string;
    email: string;
    password: string;
    faculty?: string;
    department?: string;
}


export interface AuthResponse {
    jwt: string;
    user: User;
}

export interface RegisterResponse{
    message:string;
}
