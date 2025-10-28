FROM apify/actor-node-playwright-chrome:22-1.56.1 AS builder

COPY --chown=myuser:myuser package.json yarn.lock tsconfig.json ./

RUN yarn install --frozen-lockfile --check-files

COPY --chown=myuser:myuser . ./
RUN yarn build

FROM apify/actor-node-playwright-chrome:22-1.56.1

COPY --chown=myuser:myuser package.json yarn.lock ./

RUN yarn install --frozen-lockfile --production --ignore-optional && \
    yarn cache clean

COPY --from=builder --chown=myuser:myuser /home/myuser/dist ./dist
COPY --chown=myuser:myuser . ./

CMD ["yarn", "start:prod"]
