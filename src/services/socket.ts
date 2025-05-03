import { io, Socket } from 'socket.io-client';

// Usar a mesma URL da API
const API_URL = 'http://localhost:3333';

// Definição de tipos para os dados
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SocketEventData = any; // Necessário para compatibilidade com diferentes tipos de eventos
type SocketEventCallback<T = SocketEventData> = (data: T) => void;

class SocketService {
  private socket: Socket | null = null;
  private listeners: { [event: string]: Array<SocketEventCallback> } = {};
  private reconnectTimer: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;

  connect(): void {
    if (this.socket?.connected) {
      console.log('Socket já está conectado, reutilizando conexão.');
      return;
    }
    
    if (this.socket) {
      console.log('Socket existe mas não está conectado, tentando reconectar...');
      this.socket.connect();
      return;
    }
    
    console.log('Iniciando nova conexão com o socket em:', API_URL);
    this.socket = io(API_URL, {
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      autoConnect: true,
      withCredentials: false,
      timeout: 10000,
      transports: ['websocket', 'polling']
    });
    
    this.socket.on('connect', () => {
      console.log('✅ Socket conectado com sucesso! ID:', this.socket?.id);
      this.reconnectAttempts = 0;
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
      }
    });
    
    this.socket.on('disconnect', () => {
      console.log('❌ Socket desconectado');
      this.tryReconnect();
    });
    
    this.socket.on('connect_error', (error) => {
      console.error('Erro de conexão socket:', error.message);
      this.tryReconnect();
    });
    
    // Configurando listeners para eventos do servidor
    this.setupServerEvents();
  }
  
  private tryReconnect(): void {
    if (this.reconnectTimer || this.reconnectAttempts >= this.maxReconnectAttempts) return;
    
    this.reconnectAttempts++;
    console.log(`Tentando reconectar (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
    
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (this.socket) {
        this.socket.connect();
      } else {
        this.connect();
      }
    }, 1000);
  }
  
  private setupServerEvents(): void {
    if (!this.socket) return;
    
    // Eventos específicos da aplicação
    const socketEvents = ['newOrder', 'newMatch', 'updateStatistics', 'orderCancelled', 'balanceUpdate', 'orderBookUpdate'];
    
    // Configuração otimizada para alta prioridade para certos eventos
    const highPriorityEvents = ['orderBookUpdate', 'balanceUpdate', 'newOrder'];
    
    socketEvents.forEach(event => {
      this.socket?.on(event, (data: SocketEventData) => {
        console.log(`📣 Recebido evento "${event}":`, data);
        
        if (highPriorityEvents.includes(event)) {
          // Para eventos de alta prioridade, processamos imediatamente
          this.processEventImmediately(event, data);
        } else {
          // Para eventos regulares, usar o comportamento normal
          if (this.listeners[event]) {
            this.listeners[event].forEach(callback => callback(data));
          } else {
            console.warn(`⚠️ Nenhum listener registrado para o evento "${event}"`);
          }
        }
      });
    });
  }
  
  private processEventImmediately(event: string, data: SocketEventData): void {
    // Use setTimeout com tempo zero para priorizar o evento na fila de processamento 
    // mas ainda permitir que o navegador responda a eventos de UI
    setTimeout(() => {
      if (this.listeners[event]) {
        this.listeners[event].forEach(callback => callback(data));
      } else {
        console.warn(`⚠️ Nenhum listener registrado para o evento de alta prioridade "${event}"`);
      }
    }, 0);
  }
  
  on(event: string, callback: SocketEventCallback): void {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }
  
  off(event: string, callback: SocketEventCallback): void {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }
  }
  
  emit(event: string, data: SocketEventData): void {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    } else {
      console.warn('Socket não conectado, evento não enviado:', event);
      // Tenta reconectar
      this.connect();
    }
  }
  
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }
  
  isConnected(): boolean {
    const isConn = !!this.socket?.connected;
    console.log('Status da conexão socket:', isConn ? 'Conectado' : 'Desconectado');
    return isConn;
  }
}

// Exportar uma instância única do serviço
const socketService = new SocketService();
export default socketService; 