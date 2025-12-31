# Specify the base Docker image.
FROM apify/actor-node:22

# Copy just package.json and package-lock.json
COPY --chown=myuser:myuser package*.json ./

# Install NPM packages and git (required for lingo.dev)
RUN npm --quiet set progress=false \
    && npm install --omit=dev --omit=optional \
    && apk add --no-cache git \
    && echo "Installed NPM packages:" \
    && (npm list --omit=dev --all || true) \
    && echo "Node.js version:" \
    && node --version \
    && echo "NPM version:" \
    && npm --version \
    && rm -r ~/.npm

# Copy the remaining files
COPY --chown=myuser:myuser . ./

# Run the image
CMD npm start --silent
