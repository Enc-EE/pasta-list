export interface CurrentUser {
    id: string
    email: string
    createdAt: string
    lastLoginAt: string | null
}

export interface RequestLoginCodeRequest {
    email: string
}

export interface VerifyLoginCodeRequest {
    email: string
    code: string
}
