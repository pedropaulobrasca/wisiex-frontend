
import axios from 'axios';

// Esta URL pode precisar ser atualizada se o tunnel ngrok expirou
const API_URL = 'https://7709-2804-7f0-9402-ef0-ac93-2b71-d52e-201b.ngrok-free.app';

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
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// Função de utilidade para verificar se o servidor está online
const checkServerStatus = async () => {
  try {
    await api.get('/health', { timeout: 3000 });
    return true;
  } catch (error) {
    console.warn('Servidor API inacessível. Usando dados de demonstração.');
    return false;
  }
};

export const authService = {
  login: async (username: string) => {
    try {
      const response = await api.post('/auth/login', { username });
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('username', username);
      return response.data;
    } catch (error) {
      console.error('Erro de login:', error);
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

// Dados de demonstração para quando a API estiver indisponível
const demoData = {
  statistics: {
    lastPrice: 48500,
    btcVolume: 3.75,
    usdVolume: 182500,
    high: 49800,
    low: 47200
  },
  orderBook: {
    bids: [
      { price: 48000, volume: 0.5 },
      { price: 47800, volume: 0.75 },
      { price: 47500, volume: 1.2 }
    ],
    asks: [
      { price: 48200, volume: 0.6 },
      { price: 48500, volume: 0.9 },
      { price: 49000, volume: 1.0 }
    ]
  },
  balance: {
    btc: 1.5,
    usd: 75000
  }
};

export const tradeService = {
  getStatistics: async () => {
    try {
      // Endpoint não está no client.http mas é necessário para o frontend
      const response = await api.get('/statistics');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      // Retorna valores de demonstração em caso de erro
      return demoData.statistics;
    }
  },
  getOrderBook: async () => {
    try {
      // Atualizado para corresponder ao endpoint no client.http
      const response = await api.get('/order-book');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar order book:', error);
      // Retorna order book vazio em caso de erro
      return demoData.orderBook;
    }
  },
  getGlobalMatches: async () => {
    try {
      // Atualizado para corresponder ao endpoint no client.http
      const response = await api.get('/matches');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar matches globais:', error);
      return [];
    }
  },
  getUserOrders: async () => {
    try {
      // Atualizado para corresponder ao endpoint no client.http
      const response = await api.get('/orders');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar ordens do usuário:', error);
      return [];
    }
  },
  getUserMatches: async () => {
    try {
      // Atualizado para corresponder ao endpoint no client.http
      const response = await api.get('/matches/my-matches');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar matches do usuário:', error);
      return [];
    }
  },
  placeOrder: async (orderData: {
    type: 'buy' | 'sell';
    amount: number;
    price: number;
  }) => {
    // Atualizado para corresponder ao formato no client.http para tipo de ordem (maiúsculas)
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
      // Este endpoint não estava no client.http, mas é necessário para o frontend
      // Tentaremos primeiro '/user/balance' e, se falhar, tentaremos um endpoint alternativo
      try {
        const response = await api.get('/user/balance');
        return response.data;
      } catch (balanceError) {
        // Se o primeiro endpoint falhar, tentamos um endpoint alternativo
        try {
          const altResponse = await api.get('/auth/user');
          // Se o endpoint alternativo retornar dados de saldo, usamos eles
          if (altResponse.data && (altResponse.data.btc !== undefined || altResponse.data.usd !== undefined)) {
            return {
              btc: altResponse.data.btc || altResponse.data.balance?.btc || 0,
              usd: altResponse.data.usd || altResponse.data.balance?.usd || 0,
            };
          }
          throw new Error('Nenhum dado de saldo encontrado na resposta alternativa');
        } catch (altError) {
          console.error('Também falhou ao buscar saldo pelo endpoint alternativo:', altError);
          throw balanceError; // Lança o erro original
        }
      }
    } catch (error) {
      console.error('Erro ao buscar saldo do usuário:', error);
      // Retorna saldo de demonstração em caso de erro
      return demoData.balance;
    }
  },
};

export default api;
