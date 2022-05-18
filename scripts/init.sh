if [ -n "$RESTORE_MODE" ]; then
  /scripts/restore.sh
else
  node /scripts/crontab.js
fi

