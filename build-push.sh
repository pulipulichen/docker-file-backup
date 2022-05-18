TAG=20220518-2140

REPO=docker-file-backup

docker build -t pudding/$REPO:$TAG .
docker push pudding/$REPO:$TAG