FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# A flag --host expõe a porta do Vite para fora do contêiner Docker
CMD ["npm", "run", "dev", "--", "--host"]