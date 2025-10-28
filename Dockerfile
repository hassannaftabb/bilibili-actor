FROM apify/actor-node-playwright-chrome:22-1.56.1 AS builder

# Copy manifests first for caching
COPY --chown=myuser:myuser package.json yarn.lock tsconfig.json ./

# Install dependencies (including devDependencies)
RUN yarn install --frozen-lockfile --check-files --production=false

# Copy source
COPY --chown=myuser:myuser . ./

# Build TypeScript
RUN yarn build

# --- Runtime stage ---
FROM apify/actor-node-playwright-chrome:22-1.56.1

# Copy manifests for prod install
COPY --chown=myuser:myuser package.json yarn.lock ./

# Install only prod dependencies (omit devs for smaller image)
RUN yarn install --frozen-lockfile --production=true --ignore-optional && yarn cache clean

# Copy build output and metadata
COPY --from=builder --chown=myuser:myuser /home/myuser/dist ./dist
COPY --chown=myuser:myuser . ./

CMD ["yarn", "start:prod"]
