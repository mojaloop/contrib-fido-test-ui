FROM node:14.3.0-alpine as builder

WORKDIR /opt/contrib-fido-test-ui

RUN apk add --no-cache -t build-dependencies git make gcc g++ python libtool autoconf automake \
  && cd $(npm root -g)/npm \
  && npm config set unsafe-perm true \
  && npm install -g node-gyp 

# Cache npm dependencies
COPY package*.json ./
RUN npm ci

# Check in .dockerignore what is skipped during copy
COPY . .

# Create empty log file & 
RUN mkdir ./logs && touch ./logs/combined.log

# Link stdout to the application log file
RUN ln -sf /dev/stdout ./logs/combined.log

# USER node 
# copy bundle
# COPY --chown=node --from=builder /opt/contrib-fido-test-ui'/ .

# cleanup
RUN apk del build-dependencies
# RUN npm prune --production

EXPOSE 8080
CMD ["npm", "run", "start"]
