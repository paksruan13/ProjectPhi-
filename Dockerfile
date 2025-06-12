FROM node:18

# Install system dependencies
RUN apt-get update && apt-get install -y curl wget && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm install

# Generate Prisma client during build
RUN npx prisma generate

# Copy source code
COPY . .

EXPOSE 4243

CMD ["node", "src/index.js"]