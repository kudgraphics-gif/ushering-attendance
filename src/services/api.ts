import type {
    UserDto,
    Event,
    LoginPayload,
    CreateEventRequest,
    UpdateEventRequest,
    CheckIntoEventRequest,
    PaginatedResult,
    ActivityLogResponse,
    NewRoster,
    UpdateRosterRequest,
    Roster,
    AttendanceWithUser,
    Group,
    GroupDetail,
    GroupHistoryItem,
    GroupAttendanceResponse,
    SuggestionListResponse,
    Hall,
    HallAttendanceResponse,
} from '../types';

const BASE_URL = 'https://api.koinoniaushers.cloud/api/v1';

// Helper function to make API calls
async function apiCall<T>(
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    endpoint: string,
    data?: unknown,
    token?: string
): Promise<T> {
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    };

    if (token) {
        // headers['Authorization'] = `Bearer ${token}`;
    }

    try {
        console.log(`[API] ${method} ${BASE_URL}${endpoint}`, data);

        const response = await fetch(`${BASE_URL}${endpoint}`, {
            method,
            headers,
            credentials: 'include', // Send cookies and auth tokens
            body: data ? JSON.stringify(data) : undefined,
        });

        console.log(`[API] Response status: ${response.status}`, response);

        if (!response.ok) {
            let errorMessage = `API Error: ${response.statusText}`;
            try {
                const error = await response.json();
                errorMessage = error.message || errorMessage;
            } catch {
                // Response wasn't JSON, use status text
            }
            throw new Error(errorMessage);
        }

        // Try to parse response
        let responseData: T;
        try {
            const text = await response.text();
            console.log(`[API] Response body: ${text}`);

            if (!text) {
                console.warn(`[API] Empty response body for ${method} ${endpoint}`);
                return {} as T;
            }

            responseData = JSON.parse(text);
        } catch (parseError) {
            console.error(`[API] Failed to parse JSON response:`, parseError);
            throw new Error(`Invalid response format from server: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
        }

        return responseData;
    } catch (error) {
        // Provide more specific error messages
        if (error instanceof TypeError) {
            if (error.message.includes('Failed to fetch')) {
                throw new Error(
                    'Connection failed. Please check if the API server is running at: ' + BASE_URL
                );
            }
            throw new Error('Network error: ' + error.message);
        }
        throw error;
    }
}

// Auth APIs
export const authAPI = {
    login: async (payload: LoginPayload): Promise<UserDto> => {
        return apiCall<UserDto>('POST', '/auth/login', payload);
    },

    refresh: async (): Promise<{ message: string; data: UserDto }> => {
        return apiCall<{ message: string; data: UserDto }>('POST', '/auth/refresh');
    },
};

// Events APIs
export const eventsAPI = {
    create: async (payload: CreateEventRequest, token: string): Promise<Event> => {
        return apiCall<Event>('POST', '/events/create', payload, token);
    },

    getAll: async (token: string): Promise<Event[]> => {
        return apiCall<Event[]>('GET', '/events', undefined, token);
    },

    getUpcoming: async (token: string): Promise<Event[]> => {
        return apiCall<Event[]>('GET', '/events/upcoming', undefined, token);
    },

    getPast: async (token: string): Promise<Event[]> => {
        return apiCall<Event[]>('GET', '/events/past', undefined, token);
    },

    getById: async (eventId: string, token: string): Promise<Event> => {
        return apiCall<Event>('GET', `/events/get/${eventId}`, undefined, token);
    },

    update: async (payload: UpdateEventRequest, token: string): Promise<Event> => {
        return apiCall<Event>('PATCH', '/events/update', payload, token);
    },

    delete: async (eventId: string, token: string): Promise<void> => {
        return apiCall<void>('DELETE', `/events/delete/${eventId}`, undefined, token);
    },

    checkIn: async (payload: CheckIntoEventRequest, token: string): Promise<{ message: string; status_code: number }> => {
        return apiCall<{ message: string; status_code: number }>(
            'POST',
            '/events/attendance/check-in',
            payload,
            token
        );
    },
};

// Users APIs
export const usersAPI = {
    register: async (payload: Omit<UserDto, 'id' | 'created_at' | 'last_seen' | 'reg_no'> & { password: string }, token: string): Promise<{ message: string; data: null }> => {
        return apiCall<{ message: string; data: null }>(
            'POST',
            '/users/admin/register',
            payload,
            token
        );
    },

    getAll: async (token: string): Promise<UserDto[]> => {
        return apiCall<UserDto[]>('GET', '/users/admin/get_all', undefined, token);
    },

    getById: async (userId: string, token: string): Promise<UserDto> => {
        return apiCall<UserDto>('GET', `/users/get/${userId}`, undefined, token);
    },

    adminUpdate: async (userId: string, payload: Partial<UserDto> & { password?: string }, token: string): Promise<{ message: string; data: null }> => {
        return apiCall<{ message: string; data: null }>(
            'PATCH',
            `/users/admin/update/${userId}`,
            payload,
            token
        );
    },

    update: async (payload: Partial<UserDto> & { password?: string }, token: string): Promise<{ message: string; data: null }> => {
        return apiCall<{ message: string; data: null }>(
            'PATCH',
            '/users/update',
            payload,
            token
        );
    },

    changePassword: async (email: string, password: string, token: string): Promise<{ message: string }> => {
        return apiCall<{ message: string }>(
            'POST',
            '/users/change-password',
            { email, password },
            token
        );
    },

    uploadAvatar: async (file: File, _token: string): Promise<{ message: string; data: { avatar_url: string } }> => {
        const formData = new FormData();
        formData.append('file', file);

        const headers: HeadersInit = {
            'Accept': 'application/json',
        };

        try {
            console.log(`[API] POST ${BASE_URL}/users/upload-avatar`, file);

            const response = await fetch(`${BASE_URL}/users/upload-avatar`, {
                method: 'POST',
                headers,
                credentials: 'include',
                body: formData,
            });

            console.log(`[API] Response status: ${response.status}`, response);

            if (!response.ok) {
                let errorMessage = `Upload failed: ${response.statusText}`;
                try {
                    const error = await response.json();
                    errorMessage = error.message || errorMessage;
                } catch {
                    // Response wasn't JSON
                }
                throw new Error(errorMessage);
            }

            const data = await response.json();
            console.log(`[API] Upload response:`, data);

            return data;
        } catch (error) {
            if (error instanceof TypeError) {
                if (error.message.includes('Failed to fetch')) {
                    throw new Error(
                        'Connection failed. Please check if the API server is running at: ' + BASE_URL
                    );
                }
                throw new Error('Network error: ' + error.message);
            }
            throw error;
        }
    },

    delete: async (userId: string, token: string): Promise<{ message: string; data: null }> => {
        return apiCall<{ message: string; data: null }>(
            'DELETE',
            `/users/admin/delete/${userId}`,
            undefined,
            token
        );
    },

    resetDeviceId: async (userId: string, token: string): Promise<{ message: string; data: null }> => {
        return apiCall<{ message: string; data: null }>(
            'PATCH',
            `/users/admin/reset-device-id/${userId}`,
            {},
            token
        );
    },

    activate: async (userId: string, token: string): Promise<{ message: string; data: null }> => {
        return apiCall<{ message: string; data: null }>(
            'PATCH', // NOTE: If your backend uses POST instead of PATCH, change this to 'POST'
            `/users/admin/activate/${userId}`,
            undefined,
            token
        );
    },

    deactivate: async (userId: string, token: string): Promise<{ message: string; data: null }> => {
        return apiCall<{ message: string; data: null }>(
            'PATCH', // NOTE: If your backend uses POST instead of PATCH, change this to 'POST'
            `/users/admin/deactivate/${userId}`,
            undefined,
            token
        );
    },

    adminSignOut: async (userId: string, token: string): Promise<{ message: string }> => {
        return apiCall<{ message: string }>(
            'PATCH',
            `/users/admin/sign-out/${userId}`,
            undefined,
            token
        );
    },

    addStrike: async (userId: string, token: string): Promise<{ message: string; data: null }> => {
        return apiCall<{ message: string; data: null }>(
            'PATCH', // NOTE: If your backend uses PATCH instead of POST, change this to 'PATCH'
            `/users/admin/strike/${userId}`,
            undefined,
            token
        );
    },
};

// Attendance APIs
export const attendanceAPI = {
    checkIn: async (
        payload: { location: { lat: number; lng: number }; device_id: string },
        token: string
    ): Promise<{ message: string; status_code: number }> => {
        return apiCall<{ message: string; status_code: number }>(
            'POST',
            '/attendance/check-in',
            payload,
            token
        );
    },

    signOut: async (
        payload: { location: { lat: number; lng: number }; device_id: string },
        token: string
    ): Promise<{ message: string; status_code: number }> => {
        return apiCall<{ message: string; status_code: number }>(
            'POST',
            '/attendance/signout',
            payload,
            token
        );
    },

    adminSign: async (userId: string, token: string): Promise<{ message: string }> => {
        return apiCall<{ message: string }>(
            'GET',
            `/attendance/admin/sign/${userId}`,
            undefined,
            token
        );
    },
};

// Analytics APIs
export const analyticsAPI = {
    getTotalUsers: async (token: string): Promise<{ message: string; data: UserDto[] }> => {
        return apiCall<{ message: string; data: UserDto[] }>(
            'GET',
            '/analytics/total-users',
            undefined,
            token
        );
    },

    getUpcomingBirthdays: async (token: string): Promise<{ message: string; data: UserDto[] }> => {
        return apiCall<{ message: string; data: UserDto[] }>(
            'GET',
            '/analytics/upcoming-birthdays',
            undefined,
            token
        );
    },

    getUserAttendance: async (userId: string, token: string): Promise<{
        message: string;
        data: {
            user: UserDto;
            history: Array<{
                id: string;
                user_id: string;
                date: string;
                week_day: string;
                time_in: string;
                time_out: string | null;
                marked_by: string | null;
                event_id: string;
                attendance_type: string;
                created_at: string;
                updated_at: string;
            }>;
            summary: {
                total_days: number;
                days_present: number;
                rate: number;
            };
        };
    }> => {
        return apiCall(
            'GET',
            `/analytics/user-attendance/${userId}`,
            undefined,
            token
        );
    },

    getUsersOnDay: async (date: string, token: string): Promise<{
        message: string;
        data: AttendanceWithUser[];
    }> => {
        return apiCall(
            'GET',
            `/attendance/on-day/${date}`,
            undefined,
            token
        );
    },

    getAttendanceRates: async (token: string): Promise<{
        message: string;
        data: {
            admin_rate: number;
            user_rate: number;
            technical_rate: number;
            total_users: number;
            active_users: number;
            suspended_users: number;
        };
    }> => {
        return apiCall(
            'GET',
            '/analytics/attendance-rates',
            undefined,
            token
        );
    },

    getAttendanceReport: async (token: string, queryString: string): Promise<{
        message: string;
        data: {
            period_label: string;
            start_date: string;
            end_date: string;
            rows: any[];
        };
    }> => {
        return apiCall(
            'GET',
            `/analytics/attendance-report${queryString ? `?${queryString}` : ''}`,
            undefined,
            token
        );
    },

    getEventReport: async (eventId: string, token: string): Promise<{
        message: string;
        data: {
            total_attendees: number;
            eligible_attendees_count: number;
            attendees: any[];
            absentees: any[];
        };
    }> => {
        return apiCall(
            'GET',
            `/analytics/event-report/${eventId}`,
            undefined,
            token
        );
    },
};

// Users import/export APIs
export const usersExportAPI = {
    exportUsers: async (_token: string): Promise<Blob> => {
        const response = await fetch(`${BASE_URL}/users/admin/export`, {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Accept': 'text/csv',
            },
        });

        if (!response.ok) {
            throw new Error(`Export failed: ${response.statusText}`);
        }

        return response.blob();
    },

    importUsers: async (file: File, _token: string): Promise<{ message: string; data: null }> => {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`${BASE_URL}/users/admin/import`, {
            method: 'POST',
            credentials: 'include',
            body: formData,
        });

        if (!response.ok) {
            throw new Error(`Import failed: ${response.statusText}`);
        }

        return response.json();
    },
};

// Activity Logs APIs
export interface ActivityLog {
    id: string;
    user_id: string;
    user_name: string;
    user_email: string | null;
    user_role: string;
    first_name: string | null;
    last_name: string | null;
    activity_type: string;
    created_at: string;
}

export const activityLogsAPI = {
    getAll: async (
        token: string,
        page: number = 1,
        size: number = 10,
        search?: string,
        filter?: string,
        context?: string
    ): Promise<PaginatedResult<ActivityLogResponse>> => {
        const params = new URLSearchParams();
        params.append('page', page.toString());
        params.append('size', size.toString());
        if (search) params.append('search', search);
        if (filter) params.append('filter', filter);
        if (context) params.append('context', context);

        return apiCall<PaginatedResult<ActivityLogResponse>>(
            'GET',
            `/logs?${params.toString()}`,
            undefined,
            token
        );
    },

    getByUserId: async (userId: string, token: string): Promise<ActivityLogResponse[]> => {
        return apiCall<ActivityLogResponse[]>(
            'GET',
            `/logs/user/${userId}`,
            undefined,
            token
        );
    },

    getById: async (logId: string, token: string): Promise<ActivityLogResponse> => {
        return apiCall<ActivityLogResponse>(
            'GET',
            `/logs/${logId}`,
            undefined,
            token
        );
    },
};

// Roster Management APIs
// Roster interface is imported from ../types
export interface RosterAssignment {
    id: string;
    user_id: string;
    first_name: string;
    last_name: string;
    reg_no: string;
    hall: string;
}

export interface RosterStats {
    hall: string;
    roster_id: string;
    total_expected: number;
    total_assigned: number;
    total_unassigned: number;
    percentage_assigned: number;
    percentage_unassigned: number;
    number_of_male: number;
    number_of_female: number;
}

export const rosterAPI = {
    create: async (payload: NewRoster, token: string): Promise<{ message: string; data: Roster }> => {
        return apiCall<{ message: string; data: Roster }>(
            'POST',
            '/roster/create',
            payload,
            token
        );
    },

    update: async (payload: UpdateRosterRequest, token: string): Promise<{ message: string; data: Roster }> => {
        return apiCall<{ message: string; data: Roster }>(
            'PATCH',
            '/roster/update',
            payload,
            token
        );
    },

    getById: async (id: string, token: string): Promise<Roster> => {
        return apiCall<Roster>(
            'GET',
            `/roster/${id}`,
            undefined,
            token
        );
    },

    delete: async (id: string, token: string): Promise<{ message: string; data: null }> => {
        return apiCall<{ message: string; data: null }>(
            'DELETE',
            `/roster/${id}`,
            undefined,
            token
        );
    },

    getAll: async (token: string): Promise<Roster[]> => {
        return apiCall<Roster[]>(
            'GET',
            '/roster/all',
            undefined,
            token
        );
    },

    activate: async (id: string, token: string): Promise<{ message: string }> => {
        return apiCall<{ message: string }>(
            'POST',
            `/roster/activate-gendered/${id}`,
            undefined,
            token
        );
    },

    getAssignments: async (id: string, token: string): Promise<RosterAssignment[]> => {
        return apiCall<RosterAssignment[]>(
            'GET',
            `/roster/${id}/assignments`,
            undefined,
            token
        );
    },

    exportCombined: async (id: string, _token: string): Promise<Blob> => {
        const response = await fetch(`${BASE_URL}/roster/export/${id}`, {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Accept': 'text/csv',
            },
        });

        if (!response.ok) {
            throw new Error(`Export failed: ${response.statusText}`);
        }

        return response.blob();
    },

    exportHall: async (id: string, hall: string, _token: string): Promise<Blob> => {
        const response = await fetch(`${BASE_URL}/roster/export/${id}/hall?hall=${hall}`, {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Accept': 'text/csv',
            },
        });

        if (!response.ok) {
            throw new Error(`Export failed: ${response.statusText}`);
        }

        return response.blob();
    },

    updateUserHall: async (
        payload: { user_id: string; user_roster_id: string; hall: string },
        token: string
    ): Promise<{ message: string; data: null }> => {
        return apiCall<{ message: string; data: null }>(
            'PATCH',
            '/roster/hall',
            payload,
            token
        );
    },

    addUser: async (
        payload: { user_id: string; roster_id: string; hall: string },
        token: string
    ): Promise<{ message: string; data: null }> => {
        return apiCall<{ message: string; data: null }>(
            'POST',
            '/roster/add-user',
            payload,
            token
        );
    },

    getStats: async (id: string, token: string, hall?: string): Promise<RosterStats | RosterStats[]> => {
        const endpoint = hall ? `/roster/${id}/stats/${hall}` : `/roster/${id}/stats`;
        return apiCall<RosterStats | RosterStats[]>(
            'GET',
            endpoint,
            undefined,
            token
        );
    },
};

// Attendance Revoke API
export const attendanceRevokeAPI = {
    revoke: async (attendanceId: string, token: string): Promise<{ message: string; data: null }> => {
        return apiCall<{ message: string; data: null }>(
            'DELETE',
            `/attendance/admin/revoke/${attendanceId}`,
            undefined,
            token
        );
    },
};

// Groups API
export const groupsAPI = {
    getAll: async (token: string): Promise<Group[]> => {
        return apiCall<Group[]>('GET', '/groups', undefined, token);
    },

    create: async (
        payload: { name: string; description: string; group_leader: string },
        token: string
    ): Promise<Group> => {
        return apiCall<Group>('POST', '/groups', payload, token);
    },

    getById: async (id: string, token: string): Promise<GroupDetail> => {
        return apiCall<GroupDetail>('GET', `/groups/${id}`, undefined, token);
    },

    activate: async (id: string, date: string, token: string): Promise<{ message: string }> => {
        return apiCall<{ message: string }>('PATCH', `/groups/activate/${id}`, { date }, token);
    },

    addUser: async (
        payload: { group_name: string; user_id: string },
        token: string
    ): Promise<{ message: string }> => {
        return apiCall<{ message: string }>('POST', '/groups/add-user', payload, token);
    },

    removeUser: async (
        payload: { group_id: string; user_id: string },
        token: string
    ): Promise<{ message: string }> => {
        return apiCall<{ message: string }>('DELETE', '/groups/remove-user', payload, token);
    },

    getAttendance: async (date: string, token: string): Promise<GroupAttendanceResponse> => {
        return apiCall<GroupAttendanceResponse>('GET', `/groups/attendance?date=${date}`, undefined, token);
    },

    getHistory: async (id: string, token: string): Promise<GroupHistoryItem[]> => {
        return apiCall<GroupHistoryItem[]>('GET', `/groups/history/${id}`, undefined, token);
    },

    removeAttendance: async (userId: string, date: string, token: string): Promise<{ message: string }> => {
        return apiCall<{ message: string }>('DELETE', `/groups/attendance/remove/${userId}/${date}`, undefined, token);
    },

    importUsers: async (id: string, file: File, _token: string): Promise<{ message: string }> => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await fetch(`${BASE_URL}/groups/import-users/${id}`, {
            method: 'POST',
            credentials: 'include',
            body: formData,
        });
        if (!response.ok) {
            let msg = `Import failed: ${response.statusText}`;
            try { const e = await response.json(); msg = e.message || msg; } catch { /* noop */ }
            throw new Error(msg);
        }
        return response.json();
    },
};

// Suggestions API (separate base URL)
const SUGGESTIONS_BASE = 'https://kud-server.duckdns.org';

export const suggestionsAPI = {
    getAll: async (): Promise<SuggestionListResponse> => {
        const res = await fetch(`${SUGGESTIONS_BASE}/api/suggestions`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        });
        if (!res.ok) throw new Error(`Failed to fetch suggestions: ${res.statusText}`);
        return res.json();
    },

    getById: async (id: number | string): Promise<{ id: number; message: string; category: string; createdAt: string }> => {
        const res = await fetch(`${SUGGESTIONS_BASE}/api/suggestions/${id}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        });
        if (!res.ok) throw new Error(`Failed to fetch suggestion: ${res.statusText}`);
        return res.json();
    },

    submit: async (payload: { message: string; category: string }): Promise<{ message: string }> => {
        const res = await fetch(`${SUGGESTIONS_BASE}/api/suggestions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error(`Failed to submit suggestion: ${res.statusText}`);
        return res.json();
    },
};

// Halls API
export const hallsAPI = {
    getAll: async (token: string): Promise<Hall[]> => {
        return apiCall<Hall[]>('GET', '/halls', undefined, token);
    },

    getUsersInHall: async (hallName: string, token: string): Promise<UserDto[]> => {
        return apiCall<UserDto[]>('GET', `/halls/${hallName}/users`, undefined, token);
    },

    getAttendance: async (hallName: string, token: string): Promise<HallAttendanceResponse> => {
        return apiCall<HallAttendanceResponse>('GET', `/halls/${hallName}/attendance`, undefined, token);
    },

    // Support querying attendance by date: /halls/{hallName}/attendance?date=YYYY-MM-DD
    getAttendanceByDate: async (hallName: string, date: string, token: string): Promise<HallAttendanceResponse> => {
        return apiCall<HallAttendanceResponse>('GET', `/halls/${hallName}/attendance?date=${date}`, undefined, token);
    },

    markAttendance: async (
        hallName: string,
        payload: { location: { lat: number; lng: number }; users: string[] },
        token: string
    ): Promise<{ message: string }> => {
        return apiCall<{ message: string }>('POST', `/halls/${hallName}/attendance`, payload, token);
    },

    revokeAttendance: async (
        _hallName: string,
        _date: string,
        payload: { date: string; hall: string; user_ids: string[] },
        token: string
    ): Promise<{ message: string; data: null }> => {
        // Call the halls attendance revoke endpoint with DELETE and JSON body
        return apiCall<{ message: string; data: null }>('DELETE', `/halls/attendance`, payload, token);
    },

    submitHeadCount: async (
        payload: { counts: { chair_count: number; hall: string; head_count: number }; date: string },
        token: string
    ): Promise<{ message: string }> => {
        return apiCall<{ message: string }>('POST', '/halls/counts', payload, token);
    },

    getHeadCountHistory: async (hall: string, token: string): Promise<any[]> => {
        return apiCall<any[]>('GET', `/halls/hall/counts/history?hall=${hall}`, undefined, token);
    },
};