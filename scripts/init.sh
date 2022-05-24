if [ -n "$RESTORE_MODE" ]; then
  #/scripts/restore.sh
  node /scripts/restore.js
else
  node /scripts/crontab.js
fi

