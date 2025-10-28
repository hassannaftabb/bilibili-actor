FROM apify/actor-node-playwright-chrome:22-1.56.1 AS builder

RUN npm ls crawlee apify puppeteer playwright

COPY --chown=myuser:myuser package*.json tsconfig.json ./

RUN npm install --include=dev --audit=false

COPY --chown=myuser:myuser . ./

RUN npm run build

FROM apify/actor-node-playwright-chrome:22-1.56.1

RUN npm ls crawlee apify puppeteer playwright

COPY --chown=myuser:myuser package*.json ./

RUN npm --quiet set progress=false \
    && npm install --omit=dev --omit=optional \
    && echo "Installed NPM packages:" \
    && (npm list --omit=dev --all || true) \
    && echo "Node.js version:" \
    && node --version \
    && echo "NPM version:" \
    && npm --version \
    && rm -r ~/.npm

COPY --from=builder --chown=myuser:myuser /home/myuser/dist ./dist

COPY --chown=myuser:myuser . ./

CMD npm run start:prod --silent

