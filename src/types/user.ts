// Public user types

export type UserRole = "user" | "admin";

export interface User {
    id: string;
    username: string;
    full_name: string;
    email: string | null;
    phone: string | null;
    school: string | null;
    role: UserRole;
    created_at: string;
}
