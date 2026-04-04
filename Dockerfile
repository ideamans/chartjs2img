FROM node:20-slim

# Install dependencies for Playwright Chromium + Noto Sans JP
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    fonts-noto-cjk \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libexpat1 \
    libgbm1 \
    libglib2.0-0 \
    libnspr4 \
    libnss3 \
    libpango-1.0-0 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxrandr2 \
    libxshmfence1 \
    unzip \
    wget \
    xdg-utils \
    && rm -rf /var/lib/apt/lists/* \
    && fc-cache -fv

# Install Bun
RUN wget -qO- https://bun.sh/install | bash
ENV PATH="/root/.bun/bin:${PATH}"

WORKDIR /app

# Copy package files and install
COPY package.json bun.lock* ./
RUN bun install --production

# Install Playwright Chromium
RUN bunx playwright install chromium

# Copy source
COPY src/ ./src/
COPY tsconfig.json ./

EXPOSE 3000

ENV PORT=3000
ENV HOST=0.0.0.0
ENV CONCURRENCY=8
ENV CACHE_MAX_ENTRIES=1000
ENV CACHE_TTL_SECONDS=3600
ENV PAGE_TIMEOUT_SECONDS=60

CMD ["bun", "run", "src/index.ts", "serve"]
