import axios from 'axios';

// Usar a variável de ambiente ao invés de valor hardcoded
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3333';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Aumento do timeout para permitir mais tempo para conexões lentas
  timeout: 15000,
});

// Adiciona token JWT às requisições se disponível
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Adiciona interceptor de resposta para tratar erros
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ERR_NETWORK') {
      console.error('Erro de conexão com a API. Verifique se o servidor está online:', error);
    } else if (error.response?.status === 401) {
      // Não autorizado - limpa token e redireciona para login
      localStorage.removeItem('token');
      localStorage.removeItem('username');
      localStorage.removeItem('userId');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// Função de utilidade para verificar se o servidor está online
export const checkServerStatus = async () => {
  try {
    await api.get('/health', { timeout: 3000 });
    return true;
  } catch (error) {
    console.warn('Servidor API inacessível.');
    throw error;
  }
};

export const authService = {
  login: async (username: string) => {
    try {
      const response = await api.post('/auth/login', { username });
      const token = response.data.token;
      localStorage.setItem('token', token);
      localStorage.setItem('username', username);
      
      // Extrair userId do token JWT
      if (token) {
        try {
          // Decodificar o token (sem verificar assinatura, apenas para extrair os dados)
          const base64Url = token.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
          }).join(''));
          
          const decodedToken = JSON.parse(jsonPayload);
          if (decodedToken.userId) {
            localStorage.setItem('userId', decodedToken.userId);
            console.log('userId extraído e armazenado:', decodedToken.userId);
          }
        } catch (decodeError) {
          console.error('Erro ao decodificar token:', decodeError);
        }
      }
      
      return response.data;
    } catch (error) {
      console.error('Erro de login:', error);
      throw error;
    }
  },
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('userId');
    window.location.href = '/';
  },
  getUser: () => {
    return {
      username: localStorage.getItem('username'),
      token: localStorage.getItem('token'),
      userId: localStorage.getItem('userId'),
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
      console.error('Erro ao buscar estatísticas:', error);
      throw error;
    }
  },
  getOrderBook: async () => {
    try {
      const response = await api.get('/order-book');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar order book:', error);
      throw error;
    }
  },
  getGlobalMatches: async () => {
    try {
      const response = await api.get('/matches');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar matches globais:', error);
      return [];
    }
  },
  getUserOrders: async () => {
    try {
      const response = await api.get('/orders');
      console.log('Resposta raw das ordens do usuário:', response.data);
      
      const normalizedOrders = Array.isArray(response.data) ? response.data.map(order => ({
        ...order,
        type: order.type ? order.type.toUpperCase() : 'BUY',
        
        status: order.status === 'OPEN' ? 'active' : 
               order.status === 'open' ? 'active' :
               order.status === 'CANCELED' ? 'cancelled' : 
               order.status === 'canceled' ? 'cancelled' :
               order.status === 'COMPLETED' ? 'completed' : 
               order.status === 'completed' ? 'completed' : 
               order.status || 'active'
      })) : [];
      
      console.log('Ordens normalizadas:', normalizedOrders);
      return normalizedOrders;
    } catch (error) {
      console.error('Erro ao buscar ordens do usuário:', error);
      return [];
    }
  },
  getUserMatches: async () => {
    try {
      const response = await api.get('/matches/my-matches');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar matches do usuário:', error);
      return [];
    }
  },
  placeOrder: async (orderData: {
    type: 'buy' | 'sell' | 'BUY' | 'SELL';
    amount: number;
    price: number;
  }) => {
    const formattedData = {
      ...orderData,
      type: orderData.type.toUpperCase()
    };
    const response = await api.post('/orders', formattedData);
    return response.data;
  },
  cancelOrder: async (orderId: string) => {
    const response = await api.delete(`/orders/${orderId}`);
    return response.data;
  },
  getUserBalance: async () => {
    try {
      try {
        const response = await api.get('/user/balance');
        return response.data;
      } catch (balanceError) {
        const altResponse = await api.get('/auth/user');
        if (altResponse.data && (altResponse.data.btc !== undefined || altResponse.data.usd !== undefined)) {
          return {
            btc: altResponse.data.btc || altResponse.data.balance?.btc || 0,
            usd: altResponse.data.usd || altResponse.data.balance?.usd || 0,
          };
        }
        throw new Error('Nenhum dado de saldo encontrado na resposta alternativa');
      }
    } catch (error) {
      console.error('Erro ao buscar saldo do usuário:', error);
      throw error;
    }
  },
};

export default api;
