# Etapa 1: instalar dependencias a partir de package-lock.json
FROM node:20-slim AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

# Etapa 2: imagen final mínima con el código
FROM node:20-slim
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Cloud Run inyecta la variable PORT; usamos 8080 como puerto por defecto
ENV PORT=8080
EXPOSE 8080

# El servidor escucha en process.env.PORT (ver servidor/index.js)
CMD ["npm", "start"]
