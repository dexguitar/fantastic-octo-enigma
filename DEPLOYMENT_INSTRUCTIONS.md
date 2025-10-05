# Railway Deployment with Database Migrations

## Prerequisites

Make sure your Railway project has:

- ✅ PostgreSQL service added and connected
- ✅ DATABASE_URL environment variable set to: `postgresql://postgres:IIdharbKEglJppqJRiEBGlkyAsiMDGAt@postgres.railway.internal:5432/railway`

## Deployment Steps

### 1. Deploy Your Code

```bash
# Deploy to Railway (this will automatically trigger migrations)
railway up
```

### 2. Monitor the Deployment

Watch your Railway logs to see the migration process:

```bash
railway logs --follow
```

You should see logs like:

```
[api-gateway] Testing database connection...
[api-gateway] Database connection successful
[api-gateway] Running database migrations...
[database-migration] Starting database migration...
[database-migration] Found 2 migration files
[database-migration] Running migration 000: 000_initial_schema.sql
[database-migration] Migration 000 completed successfully
[database-migration] Running migration 001: 001_add_keywords_column.sql
[database-migration] Migration 001 completed successfully
[database-migration] Database migration completed successfully
[api-gateway] Database migrations completed
[api-gateway] API Gateway running at http://0.0.0.0:3000
```

### 3. Verify Migration Success

Check that migrations were applied by connecting to your database or checking the API:

```bash
# Test the API health endpoint
curl https://your-app.railway.app/health

# Test creating a document with keywords
curl -X POST https://your-app.railway.app/api/documents \
  -H "Content-Type: application/json" \
  -d '{
    "name": "test-document.txt",
    "type": "text",
    "content": "Test content",
    "keywords": ["test", "migration", "keywords"]
  }'
```

## Alternative: Manual Migration (if needed)

If you prefer to run migrations manually before deployment:

```bash
# Run migration as a one-time job
railway run npm run migrate
```

## Environment Variables

Your Railway project should have these environment variables set:

```bash
# Database (automatically provided by Railway PostgreSQL service)
DATABASE_URL=postgresql://postgres:IIdharbKEglJppqJRiEBGlkyAsiMDGAt@postgres.railway.internal:5432/railway

# Application
NODE_ENV=production
API_PORT=3000
API_HOST=0.0.0.0

# Other environment variables as needed...
```

## Migration Safety Features

- ✅ **Idempotent**: Safe to run multiple times
- ✅ **Tracked**: Uses `schema_migrations` table to prevent duplicates
- ✅ **Atomic**: Each migration runs in a transaction
- ✅ **Backward Compatible**: Existing data is preserved

## Troubleshooting

### If migrations fail:

1. **Check Railway logs**: `railway logs`
2. **Verify database connection**: Ensure DATABASE_URL is correct
3. **Manual migration**: Run `railway run npm run migrate`
4. **Database access**: Use Railway's database console to check tables

### Check migration status:

Connect to your Railway database and run:

```sql
-- Check applied migrations
SELECT * FROM schema_migrations ORDER BY version;

-- Verify keywords column exists
\d documents
```

## Migration Rollback (if needed)

If you need to rollback the keywords feature:

```sql
-- Connect to your database and run:
DROP INDEX IF EXISTS idx_documents_keywords;
ALTER TABLE documents DROP COLUMN IF EXISTS keywords;
DELETE FROM schema_migrations WHERE version = '001';
```

## Next Steps

After successful deployment:

1. ✅ Test the keywords functionality using the API
2. ✅ Check Swagger documentation at `/api-docs`
3. ✅ Monitor application logs for any issues
4. ✅ Update your client applications to use the new keywords field
