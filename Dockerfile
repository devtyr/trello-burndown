FROM node 

ADD . /app
WORKDIR /app

RUN npm update

EXPOSE 8008
CMD node run.js


