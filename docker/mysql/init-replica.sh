#!/bin/sh
set -e

PASSWORD=iloveida
PASSWORD_READER=iloveidaread
MASTER_HOST=mysql-master

echo "[1/4] Creating replication user on master..."
mysql -h "$MASTER_HOST" -u root -p"$PASSWORD" -e "
  CREATE USER IF NOT EXISTS 'mydb_slave_user'@'%' IDENTIFIED BY 'mydb_slave_pwd';
  GRANT REPLICATION SLAVE ON *.* TO 'mydb_slave_user'@'%';
  FLUSH PRIVILEGES;
"

echo "[2/4] Creating read-only user on replica..."
mysql -h mysql-replica -u root -p"$PASSWORD" -e "
  CREATE USER IF NOT EXISTS 'pg-local-read'@'%' IDENTIFIED BY '$PASSWORD_READER';
  GRANT SELECT ON *.* TO 'pg-local-read'@'%';
  FLUSH PRIVILEGES;
"

echo "[3/4] Getting master binary log position..."
MASTER_STATUS=$(mysql -h "$MASTER_HOST" -u root -p"$PASSWORD" -e "SHOW MASTER STATUS\G")
CURRENT_LOG=$(echo "$MASTER_STATUS" | grep "File:" | awk '{print $2}')
CURRENT_POS=$(echo "$MASTER_STATUS" | grep "Position:" | awk '{print $2}')
echo "  Log file: $CURRENT_LOG, Position: $CURRENT_POS"

echo "[4/4] Configuring replica to follow master..."
mysql -h mysql-replica -u root -p"$PASSWORD" -e "
  STOP REPLICA;
  RESET REPLICA;
  CHANGE REPLICATION SOURCE TO
    SOURCE_HOST='$MASTER_HOST',
    SOURCE_USER='mydb_slave_user',
    SOURCE_PASSWORD='mydb_slave_pwd',
    SOURCE_LOG_FILE='$CURRENT_LOG',
    SOURCE_LOG_POS=$CURRENT_POS;
  START REPLICA;
"

echo "[Done] Replication configured. Checking status..."
mysql -h mysql-replica -u root -p"$PASSWORD" -e "SHOW REPLICA STATUS\G" | grep -E "Replica_IO_Running|Replica_SQL_Running|Seconds_Behind"
