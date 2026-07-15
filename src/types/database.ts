// Database row types — mirror the Supabase schema in supabase/schema.sql.

export type PostCategory = "news" | "announcement" | "tutorial" | "result";
export type UserRoleDb = "user" | "admin";
export type ContestParticipationType = "individual" | "team" | "both";
export type ContestStatus = "draft" | "active" | "closed" | "cancelled";
export type RegistrationStatus = "pending" | "approved" | "rejected" | "withdrawn";
export type MemberRole = "leader" | "member";

export interface DbUser {
    id: string;
    username: string;
    password: string;
    full_name: string;
    email: string | null;
    phone: string | null;
    school: string | null;
    role: UserRoleDb;
    created_at: string;
    updated_at: string | null;
}

export interface DbPost {
    id: number;
    slug: string;
    title: string;
    description: string;
    content: string;
    image_url: string | null;
    category: PostCategory;
    published: boolean;
    published_at: string | null;
    created_at: string;
    updated_at: string | null;
}

export interface DbTag {
    id: number;
    name: string;
    slug: string;
    created_at: string;
}

export interface DbPostTag {
    post_id: number;
    tag_id: number;
    created_at: string;
}

export interface DbPostWithRelations extends DbPost {
    tags: DbTag[];
}

export interface DbContest {
    id: number;
    slug: string;
    title: string;
    description: string;
    rules: string | null;
    cover_image_url: string | null;
    participation_type: ContestParticipationType;
    min_team_size: number;
    max_team_size: number;
    start_at: string;
    end_at: string;
    status: ContestStatus;
    created_at: string;
    updated_at: string | null;
}

export interface DbContestStage {
    id: number;
    contest_id: number;
    name: string;
    description: string | null;
    start_at: string;
    end_at: string;
    allow_registration: boolean;
    allow_submission: boolean;
    submission_type: string | null;
    prompt_text: string | null;
    display_order: number;
    created_at: string;
    updated_at: string | null;
}

export type ContestWithStages = DbContest & { stages: DbContestStage[] };

export interface DbContestRegistration {
    id: number;
    contest_id: number;
    team_code: string;
    team_name: string | null;
    level: string | null;
    status: RegistrationStatus;
    registered_at: string;
    updated_at: string | null;
}

export interface DbRegistrationMember {
    registration_id: number;
    user_id: string;
    role: MemberRole;
    joined_at: string;
}

export interface DbSubmission {
    id: number;
    registration_id: number;
    storage_path: string;
    file_name: string;
    file_size_bytes: number;
    mime_type: string;
    note: string | null;
    submitted_by: string;
    submitted_at: string;
    is_final: boolean;
}

// Minimal Supabase Database typings used by supabase-js helpers.
type Row<T> = T;
type Insert<T> = Partial<T>;
type Update<T> = Partial<T>;

export interface Database {
    public: {
        Tables: {
            users: { Row: Row<DbUser>; Insert: Insert<DbUser>; Update: Update<DbUser> };
            post: { Row: Row<DbPost>; Insert: Insert<DbPost>; Update: Update<DbPost> };
            tag: { Row: Row<DbTag>; Insert: Insert<DbTag>; Update: Update<DbTag> };
            post_tags: { Row: Row<DbPostTag>; Insert: Insert<DbPostTag>; Update: Update<DbPostTag> };
            contest: { Row: Row<DbContest>; Insert: Insert<DbContest>; Update: Update<DbContest> };
            contest_stage: { Row: Row<DbContestStage>; Insert: Insert<DbContestStage>; Update: Update<DbContestStage> };
            contest_registration: { Row: Row<DbContestRegistration>; Insert: Insert<DbContestRegistration>; Update: Update<DbContestRegistration> };
            registration_member: { Row: Row<DbRegistrationMember>; Insert: Insert<DbRegistrationMember>; Update: Update<DbRegistrationMember> };
            submission: { Row: Row<DbSubmission>; Insert: Insert<DbSubmission>; Update: Update<DbSubmission> };
        };
        Views: Record<string, never>;
        Functions: {
            is_admin: { Args: Record<string, never>; Returns: boolean };
        };
        Enums: {
            user_role: UserRoleDb;
            post_category: PostCategory;
            contest_participation_type: ContestParticipationType;
            contest_status: ContestStatus;
            registration_status: RegistrationStatus;
            member_role: MemberRole;
        };
    };
}
