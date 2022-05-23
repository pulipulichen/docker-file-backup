TAG=20220523-0223

REPO=docker-file-backup

docker build -t pudding/$REPO:$TAG .
docker push pudding/$REPO:$TAG