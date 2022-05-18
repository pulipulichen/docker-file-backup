SOURCE_PATH=/data_source
BACKUP_PATH=/data_backup
if [ "$(ls $SOURCE_PATH)" ]; then
  echo "$SOURCE_PATH is not empty. Restore is stopped."
elif [ "$(ls $BACKUP_PATH)" ]; then
  cp -rf $BACKUP_PATH/* $SOURCE_PATH
  echo "Restore is completed."
else
  echo "$BACKUP_PATH is empty. Restore is stopped."
fi