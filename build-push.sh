TAG=20220519-0057

REPO=docker-file-backup

docker build -t pudding/$REPO:$TAG .
docker push pudding/$REPO:$TAG