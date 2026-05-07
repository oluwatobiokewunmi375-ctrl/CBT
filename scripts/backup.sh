#!/bin/bash

# Database backup script
BACKUP_DIR="/backups/cbt"
DB_HOST=${DB_HOST:-localhost}
DB_USER=${DB_USER:-cbt_user}
DB_NAME=${DB_NAME:-cbt_production}
BACKUP_DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p $BACKUP_DIR

# PostgreSQL backup
echo "Backing up PostgreSQL database..."
pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME | gzip > $BACKUP_DIR/db_$BACKUP_DATE.sql.gz

# Redis backup
echo "Backing up Redis..."
redis-cli --rdb $BACKUP_DIR/redis_$BACKUP_DATE.rdb

# Upload to S3
echo "Uploading backups to S3..."
aws s3 cp $BACKUP_DIR/ s3://cbt-backups/ --recursive --sse AES256

# Cleanup old backups (keep 30 days)
echo "Cleaning up old backups..."
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete
find $BACKUP_DIR -name "*.rdb" -mtime +30 -delete

echo "Backup completed successfully!"