# Wisiex Exchange - Frontend

Interface de usuário para a plataforma Wisiex Exchange, uma exchange de criptomoedas desenvolvida com tecnologias modernas e foco em experiência de usuário.

## 🚀 Tecnologias

- **React + TypeScript**: Desenvolvimento frontend com tipagem estática
- **Vite**: Build tool rápida e eficiente
- **Tailwind CSS**: Framework CSS utility-first para design responsivo
- **shadcn/ui**: Componentes de UI reutilizáveis e acessíveis
- **Socket.io-client**: Comunicação em tempo real com o backend
- **React Query**: Gerenciamento de estado assíncrono e caching
- **React Router**: Navegação entre páginas
- **React Hook Form**: Gerenciamento de formulários

## 📊 Funcionalidades

- **Autenticação de usuários**
- **Visualização de saldo em tempo real**
- **Criação de ordens de compra/venda**
- **Cancelamento de ordens**
- **Order Book (livro de ofertas) em tempo real**
- **Histórico de matches e transações**
- **Dashboard com estatísticas atualizadas**
- **Interface responsiva e moderna**

## 🛠️ Como executar o projeto

1. Clone o repositório:
```bash
git clone https://github.com/pedropaulobrasca/wisiex-frontend.git
cd wisiex-frontend
```

2. Instale as dependências:
```bash
npm install
```

3. Configure o arquivo de ambiente:
Crie um arquivo `.env` na raiz do projeto com:
```
VITE_API_URL=http://localhost:3333
VITE_WEBSOCKET_URL=http://localhost:3334
```

4. Execute o servidor de desenvolvimento:
```bash
npm run dev
```

5. Acesse a aplicação em `http://localhost:5173`

## 📡 Comunicação com o Backend

A aplicação frontend se comunica com o backend através de:

- **API REST**: Para operações como login, criação de ordens, etc.
- **WebSockets**: Para receber atualizações em tempo real de:
  - Novas ordens
  - Novos matches
  - Atualizações de estatísticas
  - Ordens canceladas
  - Atualizações do order book
  - Atualizações de saldo

## 🧪 Testes

Execute os testes com:
```bash
npm test
```

## 📦 Build para produção

Para gerar uma build otimizada:
```bash
npm run build
```

Os arquivos serão gerados na pasta `dist/`.

## 📋 Estrutura do Projeto

```
src/
├── assets/         # Imagens e recursos estáticos
├── components/     # Componentes reutilizáveis
├── contexts/       # Contextos React
├── hooks/          # Custom hooks
├── lib/            # Utilitários e configurações
├── pages/          # Páginas da aplicação
├── services/       # Serviços de API e WebSocket
├── store/          # Gerenciamento de estado global
├── styles/         # Estilos globais
├── types/          # Definições de tipos TypeScript
└── main.tsx        # Ponto de entrada da aplicação
```

## 🔄 Melhorias recentes

- **Otimização de performance**: Redução de timers e chamadas desnecessárias
- **Atualizações otimistas na UI**: Reflexo imediato das ações do usuário antes da resposta do servidor
- **Priorização de eventos WebSocket**: Tratamento diferenciado para eventos críticos
- **Melhorias na experiência do usuário**: Feedback visual para operações em andamento
