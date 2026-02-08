import type {
    UserDto,
    Event,
    LoginPayload,
    CreateEventRequest,
    UpdateEventRequest,
    CheckIntoEventRequest,
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

    update: async (payload: Partial<UserDto> & { password?: string }, token: string): Promise<{ message: string; data: null }> => {
        return apiCall<{ message: string; data: null }>(
            'PATCH',
            '/users/update',
            payload,
            token
        );
    },

    delete: async (userId: string, token: string): Promise<{ message: string; data: null }> => {
        return apiCall<{ message: string; data: null }>(
            'DELETE',
            `/users/admin/delete/${userId}`,
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
        status_code: number;
        data?: {
            absentees: UserDto[];
        };
    }> => {
        return apiCall(
            'GET',
            `/analytics/users-on-day?date=${date}`,
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
