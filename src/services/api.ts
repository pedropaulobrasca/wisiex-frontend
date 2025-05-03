
import axios from 'axios';

const API_URL = 'http://localhost:3000'; // Change this to match your backend URL

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add JWT token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authService = {
  login: async (username: string) => {
    const response = await api.post('/auth/login', { username });
    localStorage.setItem('token', response.data.token);
    localStorage.setItem('username', username);
    return response.data;
  },
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    window.location.href = '/';
  },
  getUser: () => {
    return {
      username: localStorage.getItem('username'),
      token: localStorage.getItem('token'),
    };
  },
  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },
};

export const tradeService = {
  getStatistics: async () => {
    const response = await api.get('/statistics');
    return response.data;
  },
  getOrderBook: async () => {
    const response = await api.get('/orderbook');
    return response.data;
  },
  getGlobalMatches: async () => {
    const response = await api.get('/matches/global');
    return response.data;
  },
  getUserOrders: async () => {
    const response = await api.get('/orders/user');
    return response.data;
  },
  getUserMatches: async () => {
    const response = await api.get('/matches/user');
    return response.data;
  },
  placeOrder: async (orderData: {
    type: 'buy' | 'sell';
    amount: number;
    price: number;
  }) => {
    const response = await api.post('/orders', orderData);
    return response.data;
  },
  cancelOrder: async (orderId: string) => {
    const response = await api.delete(`/orders/${orderId}`);
    return response.data;
  },
  getUserBalance: async () => {
    const response = await api.get('/user/balance');
    return response.data;
  },
};

export default api;
