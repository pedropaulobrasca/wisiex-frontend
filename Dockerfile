# Estágio de build
FROM node:20-alpine AS build

WORKDIR /app

# Copiar arquivos de configuração
COPY package.json package-lock.json ./

# Instalar dependências
RUN npm ci

# Copiar o código fonte
COPY . .

# Construir aplicação
RUN npm run build

# Estágio de produção
FROM nginx:alpine

# Copiar configuração personalizada do nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Configuração do nginx para Single Page Application
RUN echo 'server { \
    listen 80; \
    root /usr/share/nginx/html; \
    index index.html; \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"] 