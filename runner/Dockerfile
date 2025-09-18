# Use the official Node.js 20 as a parent image
FROM node:20

# Set the working directory in the container
WORKDIR /code

# Copy package files first for better Docker layer caching
COPY package*.json ./

# Install dependencies
RUN echo "=== Installing npm dependencies ===" && \
    npm ci --verbose && \
    echo "=== Dependencies installed successfully ==="

# Copy the rest of your application's code
COPY . .

# Build TypeScript with logging
RUN echo "=== Building TypeScript application ===" && \
    npm run build && \
    echo "=== Build completed successfully ===" && \
    ls -la dist/ && \
    echo "=== Verifying built files ==="

# Create workspace directory and set permissions
RUN mkdir -p /workspace && \
    chmod 755 /workspace && \
    echo "=== Workspace directory created ==="

# Expose both ports used by the application
EXPOSE 3000
EXPOSE 3001

# Add health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "const http = require('http'); const req = http.request({hostname: 'localhost', port: 3001, path: '/health', method: 'GET'}, (res) => { process.exit(res.statusCode === 200 ? 0 : 1); }); req.on('error', () => process.exit(1)); req.end();"

# Define the command to run your app with enhanced logging
CMD echo "=== Starting Codexa Runner Service ===" && \
    echo "Node version: $(node --version)" && \
    echo "NPM version: $(npm --version)" && \
    echo "Working directory: $(pwd)" && \
    echo "Environment: NODE_ENV=${NODE_ENV:-development}" && \
    echo "Port: ${PORT:-3001}" && \
    echo "=== Starting application ===" && \
    node dist/index.js
