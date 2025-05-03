
import axios from 'axios';

const API_URL = 'https://7709-2804-7f0-9402-ef0-ac93-2b71-d52e-201b.ngrok-free.app'; // Updated API URL

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Add timeout to prevent hanging requests
  timeout: 10000,
});

// Add JWT token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('username');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export const authService = {
  login: async (username: string) => {
    try {
      const response = await api.post('/auth/login', { username });
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('username', username);
      return response.data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
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
    try {
      const response = await api.get('/statistics');
      return response.data;
    } catch (error) {
      console.error('Error fetching statistics:', error);
      // Return default values on error
      return {
        lastPrice: 0,
        btcVolume: 0,
        usdVolume: 0,
        high: 0,
        low: 0,
      };
    }
  },
  getOrderBook: async () => {
    try {
      const response = await api.get('/orderbook');
      return response.data;
    } catch (error) {
      console.error('Error fetching order book:', error);
      // Return empty order book on error
      return {
        bids: [],
        asks: [],
      };
    }
  },
  getGlobalMatches: async () => {
    try {
      const response = await api.get('/matches/global');
      return response.data;
    } catch (error) {
      console.error('Error fetching global matches:', error);
      return [];
    }
  },
  getUserOrders: async () => {
    try {
      const response = await api.get('/orders/user');
      return response.data;
    } catch (error) {
      console.error('Error fetching user orders:', error);
      return [];
    }
  },
  getUserMatches: async () => {
    try {
      const response = await api.get('/matches/user');
      return response.data;
    } catch (error) {
      console.error('Error fetching user matches:', error);
      return [];
    }
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
    try {
      const response = await api.get('/user/balance');
      return response.data;
    } catch (error) {
      console.error('Error fetching user balance:', error);
      // Return default balance on error
      return {
        btc: 0,
        usd: 0,
      };
    }
  },
};

export default api;
