FROM node:14

WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install

COPY . .
RUN yarn build

COPY static /etc/graphql-server/static

CMD ["yarn", "start"]