echo 'Before clear'
ls -l /data_backup/

echo 'Start clear'
rm -rf /data_backup/*

echo 'After clear'
ls -l /data_backup/
echo "Clear /data_backup/"