/**
 * CredoCarbon API Client
 * Centralized API service for frontend-backend communication
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://credocarbon-api-641001192587.asia-south2.run.app/api';

// Helper to get auth token
const getAuthToken = (): string | null => {
    if (typeof window !== 'undefined') {
        return localStorage.getItem('token');
    }
    return null;
};

// Helper to get headers
const getHeaders = (includeAuth: boolean = true): HeadersInit => {
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
    };

    if (includeAuth) {
        const token = getAuthToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
    }

    return headers;
};

// Generic API request handler
async function apiRequest<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;

    const response = await fetch(url, {
        ...options,
        headers: {
            ...getHeaders(!options.headers),
            ...options.headers,
        },
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Request failed' }));
        throw new Error(error.detail || `HTTP ${response.status}`);
    }

    if (response.status === 204) {
        return null as unknown as T;
    }

    return response.json();
}

// ============ AUTH API ============

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface LoginResponse {
    access_token: string;
    token_type: string;
    refresh_token: string;
    user: {
        id: number;
        email: string;
        role: string;
        profile_data: Record<string, any>;
        is_active: boolean;
        is_verified: boolean;
    };
}

export interface SignupData {
    email: string;
    password: string;
    role: 'DEVELOPER' | 'BUYER';
    name: string;
    company?: string;
    phone?: string;
}

export const authApi = {
    login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
        const response = await apiRequest<LoginResponse>('/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials),
            headers: getHeaders(false),
        });

        // Store token and user
        localStorage.setItem('token', response.access_token);
        localStorage.setItem('user', JSON.stringify(response.user));

        return response;
    },

    signup: async (data: SignupData): Promise<LoginResponse> => {
        const response = await apiRequest<LoginResponse>('/auth/signup', {
            method: 'POST',
            body: JSON.stringify(data),
            headers: getHeaders(false),
        });

        // Store token and user
        localStorage.setItem('token', response.access_token);
        localStorage.setItem('user', JSON.stringify(response.user));

        return response;
    },

    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('access_token');
        // Use replace to prevent back button navigation
        window.location.replace('/');
    },

    getCurrentUser: () => {
        const userData = localStorage.getItem('user');
        return userData ? JSON.parse(userData) : null;
    },

    isAuthenticated: (): boolean => {
        return !!getAuthToken();
    },
};

// ============ PROJECT API ============

export interface Project {
    id: number;
    developer_id: number;
    project_type: string;
    status: string;
    wizard_step: string;
    wizard_data: Record<string, any>;
    name: string;
    code: string;
    created_at: string;
    updated_at: string;
}

export interface CreateProjectData {
    projectType: string;
    name?: string;
}

export const projectApi = {
    getAll: async (): Promise<Project[]> => {
        return apiRequest<Project[]>('/projects/');
    },

    list: async (): Promise<any[]> => {
        return apiRequest<any[]>('/projects/');
    },

    getById: async (id: number): Promise<Project> => {
        return apiRequest<Project>(`/projects/${id}`);
    },

    create: async (data: CreateProjectData): Promise<Project> => {
        return apiRequest<Project>('/projects/', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    update: async (id: number, data: Partial<Project>): Promise<Project> => {
        return apiRequest<Project>(`/projects/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    updateWizard: async (id: number, step: string, data: Record<string, any>): Promise<Project> => {
        return apiRequest<Project>(`/projects/${id}/wizard`, {
            method: 'PUT',
            body: JSON.stringify({ wizard_step: step, wizard_data: data }),
        });
    },

    delete: async (id: number): Promise<void> => {
        return apiRequest<void>(`/projects/${id}`, {
            method: 'DELETE',
        });
    },
};

// ============ NOTIFICATION API ============

export interface Notification {
    id: number;
    type: string;
    title: string;
    message: string;
    read: boolean;
    created_at: string;
}

export const notificationApi = {
    getAll: async (): Promise<Notification[]> => {
        return apiRequest<Notification[]>('/api/notifications/');
    },

    markAsRead: async (id: number): Promise<void> => {
        return apiRequest<void>(`/notifications/${id}/read`, {
            method: 'PUT',
        });
    },

    markAllAsRead: async (): Promise<void> => {
        return apiRequest<void>('/api/notifications/read-all', {
            method: 'PUT',
        });
    },

    delete: async (id: number): Promise<void> => {
        return apiRequest<void>(`/notifications/${id}`, {
            method: 'DELETE',
        });
    },
};

// ============ USER API ============

export const userApi = {
    updateProfile: async (data: Record<string, any>): Promise<any> => {
        const response = await apiRequest<any>('/auth/profile', {
            method: 'PUT',
            body: JSON.stringify(data),
        });

        // Update stored user
        const currentUser = authApi.getCurrentUser();
        if (currentUser) {
            const updatedUser = { ...currentUser, profile_data: { ...currentUser.profile_data, ...data } };
            localStorage.setItem('user', JSON.stringify(updatedUser));
        }

        return response;
    },

    changePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
        return apiRequest<void>('/auth/change-password', {
            method: 'POST',
            body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
        });
    },
};

export default {
    auth: authApi,
    project: projectApi,
    notification: notificationApi,
    user: userApi,
};

// ============ WALLET API ============

export const walletApi = {
    getSummary: async (): Promise<any> => {
        return apiRequest<any>('/api/wallet/summary');
    },

    getTransactions: async (limit: number = 20): Promise<any[]> => {
        return apiRequest<any[]>(`/wallet/transactions?limit=${limit}`);
    },

    getStats: async (): Promise<any> => {
        return apiRequest<any>('/api/wallet/stats');
    },
};

// ============ DASHBOARD API ============

export const dashboardApi = {
    getDeveloperStats: async (): Promise<any> => {
        return apiRequest<any>('/dashboard/developer/stats');
    },

    getBuyerStats: async (): Promise<any> => {
        return apiRequest<any>('/dashboard/buyer/stats');
    },

    getActivity: async (limit: number = 10): Promise<any[]> => {
        return apiRequest<any[]>(`/dashboard/activity?limit=${limit}`);
    },

    getProjectsSummary: async (): Promise<any[]> => {
        return apiRequest<any[]>('/dashboard/projects/summary');
    },

    getFeaturedListings: async (): Promise<any[]> => {
        return apiRequest<any[]>('/dashboard/marketplace/featured');
    },
};

// ============ RETIREMENT API ============

export const retirementApi = {
    getAll: async (status?: string): Promise<any[]> => {
        const params = status && status !== 'all' ? `?status=${status}` : '';
        return apiRequest<any[]>(`/retirements/${params}`);
    },

    getSummary: async (): Promise<any> => {
        return apiRequest<any>('/api/retirements/summary');
    },

    getById: async (id: number): Promise<any> => {
        return apiRequest<any>(`/retirements/${id}`);
    },

    create: async (data: {
        holding_id: number;
        quantity: number;
        beneficiary: string;
        beneficiary_address: string;
        purpose: string;
    }): Promise<any> => {
        return apiRequest<any>('/api/retirements/', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    getCertificate: async (id: number): Promise<any> => {
        return apiRequest<any>(`/retirements/${id}/certificate`);
    },
};

// ============ MARKETPLACE API ============

export const marketplaceApi = {
    getListings: async (filters?: {
        project_type?: string;
        registry?: string;
        min_price?: number;
        max_price?: number;
    }): Promise<any[]> => {
        const params = new URLSearchParams();
        if (filters?.project_type) params.append('project_type', filters.project_type);
        if (filters?.registry) params.append('registry', filters.registry);
        if (filters?.min_price) params.append('min_price', filters.min_price.toString());
        if (filters?.max_price) params.append('max_price', filters.max_price.toString());
        const query = params.toString() ? `?${params.toString()}` : '';
        return apiRequest<any[]>(`/marketplace/listings${query}`);
    },

    getListing: async (id: number): Promise<any> => {
        return apiRequest<any>(`/marketplace/listings/${id}`);
    },

    createListing: async (data: {
        holding_id: number;
        quantity: number;
        price_per_ton: number;
        min_quantity?: number;
    }): Promise<any> => {
        return apiRequest<any>('/api/marketplace/listings', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    getOffers: async (status?: string): Promise<any[]> => {
        const params = status && status !== 'all' ? `?status=${status}` : '';
        return apiRequest<any[]>(`/marketplace/offers${params}`);
    },

    createOffer: async (data: {
        listing_id: number;
        quantity: number;
        price_per_ton: number;
        message?: string;
    }): Promise<any> => {
        return apiRequest<any>('/api/marketplace/offers', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    acceptOffer: async (offerId: number): Promise<any> => {
        return apiRequest<any>(`/marketplace/offers/${offerId}/accept`, {
            method: 'PUT',
        });
    },

    rejectOffer: async (offerId: number): Promise<any> => {
        return apiRequest<any>(`/marketplace/offers/${offerId}/reject`, {
            method: 'PUT',
        });
    },

    getStats: async (): Promise<any> => {
        return apiRequest<any>('/api/marketplace/stats');
    },

    getMyListings: async (): Promise<any[]> => {
        return apiRequest<any[]>('/api/marketplace/my-listings');
    },

    getMyOffers: async (): Promise<any[]> => {
        return apiRequest<any[]>('/api/marketplace/my-offers');
    },
};

// ============ GENERATION DATA API ============

export interface UploadedFile {
    id: number;
    original_filename: string;
    mime_type: string;
    file_size_bytes: number;
    status: string;
    detected_columns: ColumnInfo[] | null;
    uploaded_at: string;
}

export interface ColumnInfo {
    name: string;
    inferred_type: 'datetime' | 'numeric' | 'string';
    sample_values: any[];
    null_count: number;
}

export interface FilePreview {
    file_id: number;
    filename: string;
    columns: ColumnInfo[];
    preview_rows: any[][];
    total_rows: number;
    total_columns: number;
}

export interface DatasetMapping {
    timestamp_column: string;
    value_column: string;
    unit: 'kW' | 'MW' | 'kWh' | 'MWh';
    value_semantics: 'POWER' | 'ENERGY_PER_INTERVAL';
    frequency_seconds: number;
    timezone?: string;
    timestamp_format?: string;
}

export interface MappingValidation {
    valid: boolean;
    warnings: string[];
    errors: string[];
    sample_conversion: {
        original_value: number;
        original_unit: string;
        converted_value: number;
        converted_unit: string;
        interval_seconds: number;
    } | null;
    detected_frequency: number | null;
}

export interface MethodologyInfo {
    id: string;
    registry: string;
    name: string;
    version: string;
    applicable_project_types: string[];
    min_capacity_mw?: number;
    max_capacity_mw?: number;
    description?: string;
}

export interface GridEmissionFactor {
    country_code: string;
    country_name: string;
    region_code?: string;
    region_name?: string;
    combined_margin: number | null;
    operating_margin?: number | null;
    build_margin?: number | null;
    source_name: string;
    data_year: number;
    source_url?: string;
}

export interface EstimationRequest {
    project_id: number;
    methodology_id: string;
    country_code: string;
    ef_value?: number;
    period_start?: string;
    period_end?: string;
    additional_inputs?: Record<string, any>;
}

export interface MonthlyBreakdown {
    month: string;
    generation_mwh: number;
    emission_reductions_tco2e: number;
}

export interface AnnualBreakdown {
    vintage: number;
    generation_mwh: number;
    emission_reductions_tco2e: number;
}

export interface EstimationResult {
    id: number;
    project_id: number;
    methodology_id: string;
    registry: string;
    total_generation_mwh: number;
    total_er_tco2e: number;
    baseline_emissions_tco2e: number;
    project_emissions_tco2e: number;
    leakage_tco2e: number;
    country_code: string;
    ef_value: number;
    ef_source: string | null;
    ef_year: number | null;
    monthly_breakdown: MonthlyBreakdown[];
    annual_breakdown: AnnualBreakdown[];
    calculation_date: string;
    assumptions: Record<string, any> | null;
}

export const generationApi = {
    // File Upload
    uploadFile: async (projectId: number, file: File): Promise<UploadedFile> => {
        const formData = new FormData();
        formData.append('project_id', projectId.toString());
        formData.append('file', file);

        const url = `${API_BASE_URL}/api/generation/upload`;
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`,
            },
            body: formData,
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ detail: 'Upload failed' }));
            throw new Error(error.detail || `HTTP ${response.status}`);
        }

        return response.json();
    },

    // File Preview
    getPreview: async (fileId: number, rows: number = 50): Promise<FilePreview> => {
        return apiRequest<FilePreview>(`/api/generation/${fileId}/preview?rows=${rows}`);
    },

    // Column Mapping
    saveMapping: async (fileId: number, mapping: DatasetMapping): Promise<any> => {
        return apiRequest<any>(`/api/generation/${fileId}/mapping`, {
            method: 'POST',
            body: JSON.stringify(mapping),
        });
    },

    validateMapping: async (fileId: number, mapping: DatasetMapping): Promise<MappingValidation> => {
        return apiRequest<MappingValidation>(`/api/generation/${fileId}/validate-mapping`, {
            method: 'POST',
            body: JSON.stringify(mapping),
        });
    },

    // Methodologies
    getMethodologies: async (projectType?: string, registry?: string): Promise<{ methodologies: MethodologyInfo[] }> => {
        const params = new URLSearchParams();
        if (projectType) params.append('project_type', projectType);
        if (registry) params.append('registry', registry);
        const query = params.toString() ? `?${params.toString()}` : '';
        return apiRequest<{ methodologies: MethodologyInfo[] }>(`/api/generation/methodologies${query}`);
    },

    getMethodology: async (methodologyId: string): Promise<MethodologyInfo> => {
        return apiRequest<MethodologyInfo>(`/api/generation/methodologies/${methodologyId}`);
    },

    // Grid Emission Factors
    getGridEFs: async (countryCode?: string): Promise<{ emission_factors: GridEmissionFactor[] }> => {
        const query = countryCode ? `?country_code=${countryCode}` : '';
        return apiRequest<{ emission_factors: GridEmissionFactor[] }>(`/api/generation/grid-ef${query}`);
    },

    getCountries: async (): Promise<{ code: string; name: string }[]> => {
        return apiRequest<{ code: string; name: string }[]>('/api/api/generation/grid-ef/countries');
    },

    // Credit Estimation
    estimate: async (request: EstimationRequest): Promise<EstimationResult> => {
        return apiRequest<EstimationResult>('/api/api/generation/estimate', {
            method: 'POST',
            body: JSON.stringify(request),
        });
    },

    quickEstimate: async (
        generationMwh: number,
        countryCode: string,
        projectType: string = 'solar',
        methodologyId: string = 'CDM_AMS_ID'
    ): Promise<any> => {
        const formData = new FormData();
        formData.append('generation_mwh', generationMwh.toString());
        formData.append('country_code', countryCode);
        formData.append('project_type', projectType);
        formData.append('methodology_id', methodologyId);

        const url = `${API_BASE_URL}/api/generation/quick-estimate`;
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`,
            },
            body: formData,
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ detail: 'Estimate failed' }));
            throw new Error(error.detail || `HTTP ${response.status}`);
        }

        return response.json();
    },

    getEstimations: async (projectId: number): Promise<any[]> => {
        return apiRequest<any[]>(`/api/generation/estimations/${projectId}`);
    },
};

// ============ SUPERADMIN API ============

// Helper to get superadmin auth token (separate from regular user token)
const getSuperAdminToken = (): string | null => {
    if (typeof window !== 'undefined') {
        return localStorage.getItem('superadmin_token');
    }
    return null;
};

// Helper for superadmin headers
const getSuperAdminHeaders = (): HeadersInit => {
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
    };
    const token = getSuperAdminToken();
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
};

// Superadmin API request handler
async function superadminRequest<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;

    const response = await fetch(url, {
        ...options,
        headers: {
            ...getSuperAdminHeaders(),
            ...options.headers,
        },
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Request failed' }));
        throw new Error(error.detail || `HTTP ${response.status}`);
    }

    if (response.status === 204) {
        return null as unknown as T;
    }

    return response.json();
}

export const superadminApi = {
    // Auth
    login: async (email: string, password: string): Promise<any> => {
        const response = await superadminRequest<any>('/auth/superadmin/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });
        if (response.access_token) {
            localStorage.setItem('superadmin_token', response.access_token);
            localStorage.setItem('superadmin_user', JSON.stringify(response.user));
        }
        return response;
    },

    logout: () => {
        localStorage.removeItem('superadmin_token');
        localStorage.removeItem('superadmin_user');
        window.location.href = '/superadmin/login';
    },

    // Dashboard
    getStats: async (): Promise<any> => {
        return superadminRequest<any>('/superadmin/stats');
    },

    getActivity: async (limit: number = 20): Promise<any[]> => {
        return superadminRequest<any[]>(`/superadmin/activity?limit=${limit}`);
    },

    // Users
    getUsers: async (params: { page?: number; page_size?: number; role?: string; search?: string; is_active?: boolean } = {}): Promise<any> => {
        const searchParams = new URLSearchParams();
        if (params.page) searchParams.append('page', params.page.toString());
        if (params.page_size) searchParams.append('page_size', params.page_size.toString());
        if (params.role) searchParams.append('role', params.role);
        if (params.search) searchParams.append('search', params.search);
        if (params.is_active !== undefined) searchParams.append('is_active', params.is_active.toString());
        return superadminRequest<any>(`/superadmin/users?${searchParams.toString()}`);
    },

    updateUser: async (userId: number, data: any): Promise<any> => {
        return superadminRequest<any>(`/superadmin/users/${userId}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    deactivateUser: async (userId: number): Promise<any> => {
        return superadminRequest<any>(`/superadmin/users/${userId}`, {
            method: 'DELETE',
        });
    },

    // Admins
    getAdmins: async (params: { page?: number; page_size?: number; search?: string } = {}): Promise<any> => {
        const searchParams = new URLSearchParams();
        if (params.page) searchParams.append('page', params.page.toString());
        if (params.page_size) searchParams.append('page_size', params.page_size.toString());
        if (params.search) searchParams.append('search', params.search);
        return superadminRequest<any>(`/superadmin/admins?${searchParams.toString()}`);
    },

    createAdmin: async (data: { email: string; password: string; permission_level: string; profile_data?: any }): Promise<any> => {
        return superadminRequest<any>('/superadmin/admins', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    // Tasks
    getTasks: async (params: { page?: number; page_size?: number; task_type?: string; status?: string } = {}): Promise<any> => {
        const searchParams = new URLSearchParams();
        if (params.page) searchParams.append('page', params.page.toString());
        if (params.page_size) searchParams.append('page_size', params.page_size.toString());
        if (params.task_type) searchParams.append('task_type', params.task_type);
        if (params.status) searchParams.append('status', params.status);
        return superadminRequest<any>(`/superadmin/tasks?${searchParams.toString()}`);
    },

    createTask: async (data: { type: string; title: string; description?: string; link?: string; priority?: string }): Promise<any> => {
        return superadminRequest<any>('/superadmin/tasks', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    updateTask: async (taskId: number, data: any): Promise<any> => {
        return superadminRequest<any>(`/superadmin/tasks/${taskId}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    deleteTask: async (taskId: number): Promise<any> => {
        return superadminRequest<any>(`/superadmin/tasks/${taskId}`, {
            method: 'DELETE',
        });
    },

    // Projects
    getProjects: async (params: { page?: number; page_size?: number; status?: string; search?: string } = {}): Promise<any> => {
        const searchParams = new URLSearchParams();
        if (params.page) searchParams.append('page', params.page.toString());
        if (params.page_size) searchParams.append('page_size', params.page_size.toString());
        if (params.status) searchParams.append('status', params.status);
        if (params.search) searchParams.append('search', params.search);
        return superadminRequest<any>(`/superadmin/projects?${searchParams.toString()}`);
    },

    updateProjectStatus: async (projectId: number, status: string, notes?: string): Promise<any> => {
        return superadminRequest<any>(`/superadmin/projects/${projectId}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status, notes }),
        });
    },

    assignProjectToVVB: async (projectId: number, vvbUserId: number, taskType: string = 'validation'): Promise<any> => {
        const params = new URLSearchParams();
        params.append('vvb_user_id', vvbUserId.toString());
        params.append('task_type', taskType);
        return superadminRequest<any>(`/superadmin/projects/${projectId}/assign-vvb?${params.toString()}`, {
            method: 'POST',
        });
    },

    assignProjectToRegistry: async (projectId: number, registryUserId: number): Promise<any> => {
        const params = new URLSearchParams();
        params.append('registry_user_id', registryUserId.toString());
        return superadminRequest<any>(`/superadmin/projects/${projectId}/assign-registry?${params.toString()}`, {
            method: 'POST',
        });
    },

    getVVBUsers: async (): Promise<any> => {
        return superadminRequest<any>('/superadmin/users?role=VVB&page_size=100');
    },

    getRegistryUsers: async (): Promise<any> => {
        return superadminRequest<any>('/superadmin/users?role=REGISTRY&page_size=100');
    },

    // Transactions
    getTransactions: async (params: { page?: number; page_size?: number; tx_type?: string; status?: string } = {}): Promise<any> => {
        const searchParams = new URLSearchParams();
        if (params.page) searchParams.append('page', params.page.toString());
        if (params.page_size) searchParams.append('page_size', params.page_size.toString());
        if (params.tx_type) searchParams.append('tx_type', params.tx_type);
        if (params.status) searchParams.append('status', params.status);
        return superadminRequest<any>(`/superadmin/transactions?${searchParams.toString()}`);
    },

    // Marketplace
    getListings: async (params: { page?: number; page_size?: number; status?: string } = {}): Promise<any> => {
        const searchParams = new URLSearchParams();
        if (params.page) searchParams.append('page', params.page.toString());
        if (params.page_size) searchParams.append('page_size', params.page_size.toString());
        if (params.status) searchParams.append('status', params.status);
        return superadminRequest<any>(`/superadmin/marketplace?${searchParams.toString()}`);
    },

    removeListing: async (listingId: number): Promise<any> => {
        return superadminRequest<any>(`/superadmin/marketplace/${listingId}`, {
            method: 'DELETE',
        });
    },

    // Retirements
    getRetirements: async (params: { page?: number; page_size?: number; status?: string } = {}): Promise<any> => {
        const searchParams = new URLSearchParams();
        if (params.page) searchParams.append('page', params.page.toString());
        if (params.page_size) searchParams.append('page_size', params.page_size.toString());
        if (params.status) searchParams.append('status', params.status);
        return superadminRequest<any>(`/superadmin/retirements?${searchParams.toString()}`);
    },

    // Audit Logs
    getAuditLogs: async (params: { page?: number; page_size?: number; action?: string; entity_type?: string } = {}): Promise<any> => {
        const searchParams = new URLSearchParams();
        if (params.page) searchParams.append('page', params.page.toString());
        if (params.page_size) searchParams.append('page_size', params.page_size.toString());
        if (params.action) searchParams.append('action', params.action);
        if (params.entity_type) searchParams.append('entity_type', params.entity_type);
        return superadminRequest<any>(`/superadmin/audit-logs?${searchParams.toString()}`);
    },

    // Health
    getHealth: async (): Promise<any> => {
        return superadminRequest<any>('/superadmin/health');
    },

    // Analytics
    getAnalytics: async (): Promise<any> => {
        return superadminRequest<any>('/superadmin/analytics');
    },

    // Notifications
    broadcastNotification: async (data: { title: string; message: string; target_roles?: string[] }): Promise<any> => {
        return superadminRequest<any>('/superadmin/notifications', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    // ===== Configuration APIs =====

    // Registries
    getRegistries: async (includeInactive = false): Promise<any[]> => {
        return superadminRequest<any[]>(`/superadmin/config/registries?include_inactive=${includeInactive}`);
    },
    createRegistry: async (data: any): Promise<any> => {
        return superadminRequest<any>('/superadmin/config/registries', { method: 'POST', body: JSON.stringify(data) });
    },
    updateRegistry: async (id: number, data: any): Promise<any> => {
        return superadminRequest<any>(`/superadmin/config/registries/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    },
    deleteRegistry: async (id: number): Promise<any> => {
        return superadminRequest<any>(`/superadmin/config/registries/${id}`, { method: 'DELETE' });
    },

    // Project Types
    getProjectTypes: async (includeInactive = false): Promise<any[]> => {
        return superadminRequest<any[]>(`/superadmin/config/project-types?include_inactive=${includeInactive}`);
    },
    createProjectType: async (data: any): Promise<any> => {
        return superadminRequest<any>('/superadmin/config/project-types', { method: 'POST', body: JSON.stringify(data) });
    },
    updateProjectType: async (id: number, data: any): Promise<any> => {
        return superadminRequest<any>(`/superadmin/config/project-types/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    },
    deleteProjectType: async (id: number): Promise<any> => {
        return superadminRequest<any>(`/superadmin/config/project-types/${id}`, { method: 'DELETE' });
    },

    // Feature Flags
    getFeatureFlags: async (): Promise<any[]> => {
        return superadminRequest<any[]>('/superadmin/config/feature-flags');
    },
    createFeatureFlag: async (data: any): Promise<any> => {
        return superadminRequest<any>('/superadmin/config/feature-flags', { method: 'POST', body: JSON.stringify(data) });
    },
    updateFeatureFlag: async (id: number, data: any): Promise<any> => {
        return superadminRequest<any>(`/superadmin/config/feature-flags/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    },
    deleteFeatureFlag: async (id: number): Promise<any> => {
        return superadminRequest<any>(`/superadmin/config/feature-flags/${id}`, { method: 'DELETE' });
    },

    // Announcements
    getAnnouncements: async (includeInactive = false): Promise<any[]> => {
        return superadminRequest<any[]>(`/superadmin/config/announcements?include_inactive=${includeInactive}`);
    },
    createAnnouncement: async (data: any): Promise<any> => {
        return superadminRequest<any>('/superadmin/config/announcements', { method: 'POST', body: JSON.stringify(data) });
    },
    updateAnnouncement: async (id: number, data: any): Promise<any> => {
        return superadminRequest<any>(`/superadmin/config/announcements/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    },
    deleteAnnouncement: async (id: number): Promise<any> => {
        return superadminRequest<any>(`/superadmin/config/announcements/${id}`, { method: 'DELETE' });
    },

    // Platform Fees
    getPlatformFees: async (): Promise<any[]> => {
        return superadminRequest<any[]>('/superadmin/config/fees');
    },
    createPlatformFee: async (data: any): Promise<any> => {
        return superadminRequest<any>('/superadmin/config/fees', { method: 'POST', body: JSON.stringify(data) });
    },
    updatePlatformFee: async (id: number, data: any): Promise<any> => {
        return superadminRequest<any>(`/superadmin/config/fees/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    },
    deletePlatformFee: async (id: number): Promise<any> => {
        return superadminRequest<any>(`/superadmin/config/fees/${id}`, { method: 'DELETE' });
    },

    // Email Templates
    getEmailTemplates: async (): Promise<any[]> => {
        return superadminRequest<any[]>('/superadmin/config/email-templates');
    },
    createEmailTemplate: async (data: any): Promise<any> => {
        return superadminRequest<any>('/superadmin/config/email-templates', { method: 'POST', body: JSON.stringify(data) });
    },
    updateEmailTemplate: async (id: number, data: any): Promise<any> => {
        return superadminRequest<any>(`/superadmin/config/email-templates/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    },
    deleteEmailTemplate: async (id: number): Promise<any> => {
        return superadminRequest<any>(`/superadmin/config/email-templates/${id}`, { method: 'DELETE' });
    },
};

// ============ ADMIN API ============

// Helper to get admin auth token (separate from regular user and superadmin tokens)
const getAdminToken = (): string | null => {
    if (typeof window !== 'undefined') {
        return localStorage.getItem('admin_token');
    }
    return null;
};

// Helper for admin headers
const getAdminHeaders = (): HeadersInit => {
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
    };
    const token = getAdminToken();
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
};

// Admin API request handler
async function adminRequest<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;

    const response = await fetch(url, {
        ...options,
        headers: {
            ...getAdminHeaders(),
            ...options.headers,
        },
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Request failed' }));
        throw new Error(error.detail || `HTTP ${response.status}`);
    }

    if (response.status === 204) {
        return null as unknown as T;
    }

    return response.json();
}

export const adminApi = {
    // Auth
    login: async (email: string, password: string): Promise<any> => {
        const response = await adminRequest<any>('/auth/admin/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });
        if (response.access_token) {
            localStorage.setItem('admin_token', response.access_token);
            localStorage.setItem('admin_user', JSON.stringify(response.user));
        }
        return response;
    },

    logout: () => {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
        window.location.href = '/admin/login';
    },

    // Dashboard
    getStats: async (): Promise<any> => {
        return adminRequest<any>('/admin/dashboard/stats');
    },

    // Users (Read-Only)
    getUsers: async (params: { page?: number; page_size?: number; role?: string; search?: string; is_active?: boolean } = {}): Promise<any> => {
        const searchParams = new URLSearchParams();
        if (params.page) searchParams.append('page', params.page.toString());
        if (params.page_size) searchParams.append('page_size', params.page_size.toString());
        if (params.role) searchParams.append('role', params.role);
        if (params.search) searchParams.append('search', params.search);
        if (params.is_active !== undefined) searchParams.append('is_active', params.is_active.toString());
        return adminRequest<any>(`/admin/users?${searchParams.toString()}`);
    },

    getUser: async (userId: number): Promise<any> => {
        return adminRequest<any>(`/admin/users/${userId}`);
    },

    // Projects (Monitoring)
    getProjects: async (params: { page?: number; page_size?: number; status?: string; search?: string } = {}): Promise<any> => {
        const searchParams = new URLSearchParams();
        if (params.page) searchParams.append('page', params.page.toString());
        if (params.page_size) searchParams.append('page_size', params.page_size.toString());
        if (params.status) searchParams.append('status', params.status);
        if (params.search) searchParams.append('search', params.search);
        return adminRequest<any>(`/admin/projects?${searchParams.toString()}`);
    },

    // Transactions
    getTransactions: async (params: { page?: number; page_size?: number; tx_type?: string; status?: string } = {}): Promise<any> => {
        const searchParams = new URLSearchParams();
        if (params.page) searchParams.append('page', params.page.toString());
        if (params.page_size) searchParams.append('page_size', params.page_size.toString());
        if (params.tx_type) searchParams.append('tx_type', params.tx_type);
        if (params.status) searchParams.append('status', params.status);
        return adminRequest<any>(`/admin/transactions?${searchParams.toString()}`);
    },
};
