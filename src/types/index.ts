export type Role = "Admin" | "User" | "Technical";

export type AttendanceType =
    | "Remote"
    | "Onsite"
    | "Mandatory"
    | "Optional"
    | "Standard"
    | "Late"
    | "Excused";

export type Location = "DOA" | "CHIDA" | "OTHER";

export interface UserDto {
    id: string;
    username?: string;
    first_name: string;
    last_name: string;
    email: string;
    dob?: string;
    avatar_url?: string;
    created_at: string;
    last_seen?: string;
    year_joined: string;
    reg_no: string;
    current_roster_hall?: string;
    current_roster_allocation?: string;
    role: Role;
    device_id?: string;
    gender?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    is_active?: boolean;
}

export interface Event {
    id: string;
    title: string;
    description: string;
    date: string; // YYYY-MM-DD
    time: string; // HH:MM:SS
    grace_period_in_minutes: number;
    attendance_type: string;
    location: Location;
    created_by: string;
    created_at: string;
    updated_at: string;
}

export interface GeoPoint {
    lat: number;
    lng: number;
}

export interface AttendanceRecord {
    id: string;
    user_id: string;
    event_id?: string;
    timestamp: string;
    location?: GeoPoint;
    attendance_type: AttendanceType;
    status?: 'present' | 'late' | 'absent';
}

// Request payloads
export interface LoginPayload {
    user: string;
    password: string;
}

export interface CreateEventRequest {
    title: string;
    description: string;
    date: string;
    time: string;
    location: Location;
    attendance_type: string;
    grace_period_in_minutes: number;
}

export interface UpdateEventRequest {
    event_id: string;
    title?: string;
    description?: string;
    date?: string;
    time?: string;
    location?: Location;
    attendance_type?: string;
    grace_period_in_minutes?: number;
}

export interface CheckIntoEventRequest {
    event_id: string;
    user_id: string;
    attendance_type: string;
    location?: GeoPoint;
}

export interface SignAttendanceRequest {
    location: GeoPoint;
    device_id: string;
}

export interface NewUser {
    first_name: string;
    last_name: string;
    email: string;
    password: string;
    dob?: string;
    year_joined: string;
    is_active: boolean;
    role: Role;
    gender?: string;
    phone?: string;
}

export interface UpdateUserRequest {
    id: string;
    first_name?: string;
    last_name?: string;
    dob?: string;
}

export interface UserFilter {
    page?: number;
    limit?: number;
    search?: string;
}

export interface ChangePasswordRequest {
    email: string;
    password: string;
}

export interface Message {
    message: string;
}

// Stats for dashboard
export interface DashboardStats {
    totalEvents: number;
    attendanceRate: number;
    activeUsers: number;
    upcomingEvents: number;
    thisWeekAttendance: number;
    thisMonthAttendance: number;
}

export interface AttendanceTrend {
    date: string;
    count: number;
    rate: number;
}
// New Data Models
export interface UserAttendanceDto {
    id: string;
    user_id: string;
    date: string;
    time_in: string;
    time_out: string | null;
    marked_by: string | null;
    event_id: string | null;
    attendance_type: AttendanceType;
    created_at: string;
    updated_at: string;
    week_day: string;
}

export interface AttendanceWithUser {
    attendance: UserAttendanceDto;
    user: UserDto;
}

export type ActivityType =
    | "UserLogin"
    | "UserLogout"
    | "UserCreated"
    | "UserUpdated"
    | "UserActivation"
    | "UserDeactivation"
    | "UserMarkedAttendance"
    | "AdminMarkedAttendanceForUser"
    | "UserImported"
    | "PasswordChanged"
    | "DeviceReset"
    | "EventCreated"
    | "EventUpdated"
    | "EventDeleted"
    | "EventCheckIn"
    | "RosterCreated"
    | "RosterUpdated"
    | "RosterDeleted"
    | "AttendanceRevoked";

export interface ActivityLog {
    id: string;
    user_id: string;
    activity_type: ActivityType;
    target_id: string | null;
    target_type: string | null;
    details: any;
    created_at: string;
}

export interface ActivityLogResponse {
    id: string;
    user_id: string;
    user_name: string;
    user_email: string | null;
    user_role: string;
    first_name: string | null;
    last_name: string | null;
    activity_type: ActivityType;
    created_at: string;
}

export interface NewRoster {
    name: string;
    is_active: boolean;
    start_date: string;
    end_date: string;
    num_for_hall_one: number;
    num_for_main_hall: number;
    num_for_gallery: number;
    num_for_basement: number;
    num_for_outside: number;
    num_female_for_hall_one: number;
    num_female_for_main_hall: number;
    num_female_for_gallery: number;
    num_female_for_basement: number;
    num_female_for_outside: number;
    num_male_for_hall_one: number;
    num_male_for_main_hall: number;
    num_male_for_gallery: number;
    num_male_for_basement: number;
    num_male_for_outside: number;
    year: string;
}

export interface Roster {
    id: string;
    name: string;
    is_active: boolean;
    start_date: string;
    end_date: string;
    num_for_hall_one: number;
    num_for_main_hall: number;
    num_for_gallery: number;
    num_for_basement: number;
    num_for_outside: number;
    num_female_for_hall_one: number;
    num_female_for_main_hall: number;
    num_female_for_gallery: number;
    num_female_for_basement: number;
    num_female_for_outside: number;
    num_male_for_hall_one: number;
    num_male_for_main_hall: number;
    num_male_for_gallery: number;
    num_male_for_basement: number;
    num_male_for_outside: number;
    year: string;
    created_at: string;
    updated_at: string;
}

export interface UpdateRosterRequest extends Partial<NewRoster> {
    id: string;
}

export interface PaginatedResult<T> {
    items: T[];
    metadata: {
        page: number;
        size: number;
        total_items: number;
        num_pages: number;
    };
}