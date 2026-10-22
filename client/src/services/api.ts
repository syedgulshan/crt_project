import { 
  User, 
  DocumentRecord, 
  RequirementRecord, 
  ConflictRecord, 
  AnalysisJobRecord, 
  DashboardStats 
} from '../types/index.js';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');
let authToken: string | null = localStorage.getItem('auth_token');

export function setAuthToken(token: string | null) {
  authToken = token;
  if (token) {
    localStorage.setItem('auth_token', token);
  } else {
    localStorage.removeItem('auth_token');
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {})
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  // If body is JSON and not FormData
  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers
  });

  if (response.status === 401) {
    // Unauthenticated
    setAuthToken(null);
    window.dispatchEvent(new Event('auth:unauthorized'));
    throw new Error('Unauthorized. Please log in.');
  }

  if (!response.ok) {
    let errorMsg = `API Error (${response.status}): ${response.statusText}`;
    try {
      const errorData = await response.json();
      if (errorData.message || errorData.error) {
        errorMsg = errorData.message || errorData.error;
      }
    } catch (e) {
      // Ignore
    }
    throw new Error(errorMsg);
  }

  return response.json() as Promise<T>;
}

export const api = {
  auth: {
    syncSession: (user: Partial<User>, token: string) => 
      request<{ success: boolean; user: User; token: string }>('/auth/session', {
        method: 'POST',
        body: JSON.stringify(user)
      }),

    demoLogin: (provider: 'google' | 'apple' = 'google') =>
      request<{ success: boolean; user: User; token: string }>('/auth/demo-login', {
        method: 'POST',
        body: JSON.stringify({ provider })
      }),

    getMe: () => request<{ user: User }>('/auth/me')
  },

  documents: {
    getAll: () => request<{ documents: DocumentRecord[] }>('/documents'),

    getById: (id: string) => request<{ document: DocumentRecord; requirements: RequirementRecord[] }>(`/documents/${id}`),

    upload: (formData: FormData) => request<{ message: string; documents: any[] }>('/documents/upload', {
      method: 'POST',
      body: formData
    }),

    delete: (id: string) => request<{ success: boolean; message: string }>(`/documents/${id}`, {
      method: 'DELETE'
    }),

    seedDemo: () => request<{ success: boolean; message: string; documentCount: number; requirementCount: number }>('/documents/seed-demo', {
      method: 'POST'
    })
  },

  requirements: {
    getAll: (params?: { document_id?: string; type?: string; search?: string }) => {
      const q = new URLSearchParams();
      if (params?.document_id) q.set('document_id', params.document_id);
      if (params?.type) q.set('type', params.type);
      if (params?.search) q.set('search', params.search);
      return request<{ requirements: RequirementRecord[]; count: number }>(`/requirements?${q.toString()}`);
    },

    getById: (id: string) => request<{ requirement: RequirementRecord }>(`/requirements/${id}`)
  },

  analysis: {
    run: (payload: {
      documentIds?: string[];
      provider?: 'auto' | 'gemini' | 'openai' | 'local';
      geminiApiKey?: string;
      openaiApiKey?: string;
    }) => request<{
      success: boolean;
      jobId: string;
      status: string;
      requirements_analyzed: number;
      conflicts_found: number;
    }>('/analysis/run', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

    getStatus: (jobId: string) => request<{ job: AnalysisJobRecord }>(`/analysis/status/${jobId}`),

    getLatestJob: () => request<{ job: AnalysisJobRecord | null }>('/analysis/latest-job'),

    getConflicts: (params?: { severity?: string; conflict_type?: string; document_id?: string; search?: string }) => {
      const q = new URLSearchParams();
      if (params?.severity) q.set('severity', params.severity);
      if (params?.conflict_type) q.set('conflict_type', params.conflict_type);
      if (params?.document_id) q.set('document_id', params.document_id);
      if (params?.search) q.set('search', params.search);
      return request<{ conflicts: ConflictRecord[]; count: number }>(`/analysis/conflicts?${q.toString()}`);
    },

    getConflictById: (id: string) => request<{ conflict: ConflictRecord }>(`/analysis/conflicts/${id}`),

    getStats: () => request<{ stats: DashboardStats }>('/analysis/stats')
  },

  reports: {
    getJson: () => request<any>('/reports/json'),
    getMarkdownUrl: () => authToken ? `${API_BASE}/reports/markdown?token=${encodeURIComponent(authToken)}` : `${API_BASE}/reports/markdown`,
    getCsvUrl: () => authToken ? `${API_BASE}/reports/csv?token=${encodeURIComponent(authToken)}` : `${API_BASE}/reports/csv`,
    getHtmlUrl: () => authToken ? `${API_BASE}/reports/html?token=${encodeURIComponent(authToken)}` : `${API_BASE}/reports/html`
  }
};
