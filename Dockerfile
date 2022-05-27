FROM node:16.15.0-bullseye

RUN apt update
RUN apt-get install -y zip rsync

RUN mkdir -p /scripts
COPY package.json /scripts
WORKDIR /scripts
RUN npm i

COPY scripts /scripts
#CMD ["filebrowser", "-c", "/config/config.json", "-r", "/data"]

CMD ["bash", "/scripts/index.sh"]
