FROM apify/actor-node-playwright-chrome:22-1.56.1 AS builder

# Copy manifests first for caching
COPY --chown=myuser:myuser package.json yarn.lock tsconfig.json ./

# Install deps including devDependencies
RUN yarn install --frozen-lockfile --check-files

# Ensure TypeScript is available globally
RUN yarn global add typescript

# Copy the rest of the source
COPY --chown=myuser:myuser . ./

# Compile TypeScript to dist/
RUN yarn build

# --- Runtime image ---
FROM apify/actor-node-playwright-chrome:22-1.56.1

# Copy package manifest for production install
COPY --chown=myuser:myuser package.json yarn.lock ./

# Install production-only deps
RUN yarn install --frozen-lockfile --production --ignore-optional && \
    yarn cache clean

# Copy compiled files
COPY --from=builder --chown=myuser:myuser /home/myuser/dist ./dist

# Copy metadata (schemas, actor.json, etc.)
COPY --chown=myuser:myuser . ./

# Run actor
CMD ["yarn", "start:prod"]
