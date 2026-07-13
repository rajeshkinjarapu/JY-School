const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api/latex';

const getHeaders = () => {
  const token = localStorage.getItem('accessToken');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

export const api = {
  // Auth API
  async login(credentials: any) {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Login failed');
    }
    return res.json();
  },

  async register(data: any) {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Registration failed');
    }
    return res.json();
  },

  async me() {
    const res = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Not authenticated');
    return res.json();
  },

  // Questions API
  async getQuestions(filters: any = {}) {
    const query = new URLSearchParams();
    Object.entries(filters).forEach(([key, val]) => {
      if (val) query.append(key, String(val));
    });
    const res = await fetch(`${API_BASE_URL}/questions?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch questions');
    return res.json();
  },

  async getQuestionMeta() {
    const res = await fetch(`${API_BASE_URL}/questions/meta`);
    if (!res.ok) throw new Error('Failed to fetch metadata');
    return res.json();
  },

  async getQuestion(id: number) {
    const res = await fetch(`${API_BASE_URL}/questions/${id}`);
    if (!res.ok) throw new Error('Failed to fetch question');
    return res.json();
  },

  async createQuestion(data: any) {
    const res = await fetch(`${API_BASE_URL}/questions`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create question');
    }
    return res.json();
  },

  async updateQuestion(id: number, data: any) {
    const res = await fetch(`${API_BASE_URL}/questions/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to update question');
    }
    return res.json();
  },

  async deleteQuestion(id: number) {
    const res = await fetch(`${API_BASE_URL}/questions/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete question');
    return res.json();
  },

  async uploadImage(file: File) {
    const token = localStorage.getItem('accessToken');
    const formData = new FormData();
    formData.append('image', file);

    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE_URL}/questions/upload`, {
      method: 'POST',
      headers,
      body: formData,
    });
    if (!res.ok) throw new Error('Failed to upload image');
    return res.json();
  },

  async importQuestion(file: File) {
    const token = localStorage.getItem('accessToken');
    const formData = new FormData();
    formData.append('file', file);

    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE_URL}/questions/import`, {
      method: 'POST',
      headers,
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to extract question from file');
    }
    return res.json();
  },

  // Papers API
  async getPapers() {
    const res = await fetch(`${API_BASE_URL}/papers`);
    if (!res.ok) throw new Error('Failed to fetch papers');
    return res.json();
  },

  async getPaper(id: number) {
    const res = await fetch(`${API_BASE_URL}/papers/${id}`);
    if (!res.ok) throw new Error('Failed to fetch paper details');
    return res.json();
  },

  async getPaperScrambled(id: number, set: string) {
    const res = await fetch(`${API_BASE_URL}/papers/${id}/scramble?set=${set}`);
    if (!res.ok) throw new Error(`Failed to fetch scrambled paper set ${set}`);
    return res.json();
  },

  async createPaper(data: any) {
    const res = await fetch(`${API_BASE_URL}/papers`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create paper');
    }
    return res.json();
  },

  async updatePaper(id: number, data: any) {
    const res = await fetch(`${API_BASE_URL}/papers/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to update paper');
    }
    return res.json();
  },

  async deletePaper(id: number) {
    const res = await fetch(`${API_BASE_URL}/papers/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete paper');
    return res.json();
  },

  async exportPdf(html: string) {
    const res = await fetch(`${API_BASE_URL}/papers/export-pdf`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ html }),
    });
    if (!res.ok) throw new Error('Failed to generate PDF');
    const blob = await res.blob();
    return blob;
  },

  // Templates API
  async getTemplates() {
    const res = await fetch(`${API_BASE_URL}/templates`);
    if (!res.ok) throw new Error('Failed to fetch templates');
    return res.json();
  },

  async getTemplate(id: number) {
    const res = await fetch(`${API_BASE_URL}/templates/${id}`);
    if (!res.ok) throw new Error('Failed to fetch template');
    return res.json();
  },

  async createTemplate(data: any) {
    const res = await fetch(`${API_BASE_URL}/templates`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create template');
    return res.json();
  },

  async updateTemplate(id: number, data: any) {
    const res = await fetch(`${API_BASE_URL}/templates/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update template');
    return res.json();
  },

  async deleteTemplate(id: number) {
    const res = await fetch(`${API_BASE_URL}/templates/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete template');
    return res.json();
  },
};
