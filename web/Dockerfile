FROM node:14

WORKDIR /app

RUN yarn global add serve

COPY package.json yarn.lock ./
RUN yarn install

COPY . .
RUN yarn build

CMD ["serve", "-s", "build"]