FROM lehoanglong/nodejs:14

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

ENV PORT 80

CMD npm run prod
