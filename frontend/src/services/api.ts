import type { DashboardData } from '../types';

const API_BASE = 'http://localhost:5000/api';

export function getAuthToken(): string | null {
  return localStorage.getItem('stocksense_token');
}

export function setAuthToken(token: string) {
  localStorage.setItem('stocksense_token', token);
}

export function removeAuthToken() {
  localStorage.removeItem('stocksense_token');
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  
  const token = getAuthToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMsg = 'Request failed';
    try {
      const payload = await response.json();
      errorMsg = payload.error || errorMsg;
    } catch (e) {
      // Ignored
    }
    
    if (response.status === 401) {
      removeAuthToken();
      window.dispatchEvent(new Event('auth_unauthorized'));
    }
    
    throw new Error(errorMsg);
  }

  return response.json() as Promise<T>;
}

export type DashboardFilterParams = {
  document_type?: string;
  status?: string;
  warehouse_id?: string;
  location_id?: string;
  category_id?: string;
};

export const dashboardApi = {
  getOverview: (params?: DashboardFilterParams) => {
    const query = new URLSearchParams();
    if (params?.document_type && params.document_type !== 'all') query.append('document_type', params.document_type);
    if (params?.status && params.status !== 'all') query.append('status', params.status);
    if (params?.warehouse_id && params.warehouse_id !== 'all') query.append('warehouse_id', params.warehouse_id);
    if (params?.location_id && params.location_id !== 'all') query.append('location_id', params.location_id);
    if (params?.category_id && params.category_id !== 'all') query.append('category_id', params.category_id);
    const queryString = query.toString();
    return apiFetch<DashboardData>(`/dashboard${queryString ? `?${queryString}` : ''}`);
  }
};
