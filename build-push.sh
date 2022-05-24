TAG=20220524-1859

REPO=docker-file-backup

docker build -t pudding/$REPO:$TAG .
docker push pudding/$REPO:$TAG