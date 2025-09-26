import { API_BASE_URL } from '../config'; // Assuming you'll create a config.ts for base URL

const getAuthToken = () => {
    return localStorage.getItem('authToken');
};

const handleResponse = async (response: Response) => {
    if (response.status === 401) {
        localStorage.removeItem('authToken');
        window.location.href = '/'; // Redirect to login page
        throw new Error('Unauthorized');
    }
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.error || 'Something went wrong');
    }
    return data;
};

export const signInApi = async (email: string, password: string) => {
    const response = await fetch('/api/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });
    return handleResponse(response);
};

export const signUpApi = async (email: string, password: string) => {
    const response = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });
    return handleResponse(response);
};

export const verifyTokenApi = async (token: string) => {
    const response = await fetch('/api/verify-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
    });
    return handleResponse(response);
};

export const analyzeEssay = async (question: string, answer: string) => {
    const token = getAuthToken();
    const response = await fetch('/api/analyze-essay', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ text: question, answer: answer })
    });
    return handleResponse(response);
};

export const getHistory = async () => {
    const token = getAuthToken();
    const response = await fetch('/api/history', {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
    });
    return handleResponse(response);
};

export const deleteHistory = async () => {
    const token = getAuthToken();
    const response = await fetch('/api/history', {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
    });
    return handleResponse(response);
};

export const deleteHistoryItem = async (itemId: string) => {
    const token = getAuthToken();
    const response = await fetch(`/api/history/${itemId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
    });
    return handleResponse(response);
};

export const updateUserProfile = async (name: string, phone: string) => {
    const token = getAuthToken();
    const response = await fetch('/api/user/update', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name, phone })
    });
    return handleResponse(response);
};