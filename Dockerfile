FROM keybaseio/client:stable-node-slim

WORKDIR /app
COPY package.json /app/package.json
COPY yarn.lock /app/yarn.lock
RUN cd /app && yarn

COPY index.js /app/index.js
COPY msg.js /app/msg.js

CMD ["node", "/app/index.js"]