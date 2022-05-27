# echo "Hi, I'm sleeping for 300 seconds..."
# sleep 300

if [ -n "$INIT_MODE" ]; then
  #/scripts/restore.sh
  if [ -n "$RESET_MODE" ]; then
    #rm -rf /data_backup/*
    /scripts/clean_backup.sh
  else
    node /scripts/init.js
  fi
else
  node /scripts/crontab.js
fi

