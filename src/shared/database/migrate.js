const { query, testConnection, closePool } = require('./connection');
const { createLogger } = require('../logger');
const fs = require('fs').promises;
const path = require('path');

const logger = createLogger('database-migration');

const executeSqlFile = async (filePath) => {
  const sql = await fs.readFile(filePath, 'utf8');
  
  // Parse SQL statements, handling $$ delimiters for functions
  const statements = parseSqlStatements(sql);

  for (const statement of statements) {
    if (statement.trim()) {
      logger.info(`Executing: ${statement.substring(0, 50)}...`);
      await query(statement);
    }
  }
};

const parseSqlStatements = (sql) => {
  const statements = [];
  let currentStatement = '';
  let inDollarQuoted = false;
  let dollarTag = '';
  let i = 0;

  while (i < sql.length) {
    const char = sql[i];
    const nextChar = sql[i + 1];

    if (!inDollarQuoted) {
      // Check for start of dollar-quoted string
      if (char === '$') {
        const dollarMatch = sql.substring(i).match(/^\$([^$]*)\$/);
        if (dollarMatch) {
          dollarTag = dollarMatch[1];
          inDollarQuoted = true;
          currentStatement += dollarMatch[0];
          i += dollarMatch[0].length;
          continue;
        }
      }
      
      // Handle semicolon as statement separator
      if (char === ';') {
        const trimmed = currentStatement.trim();
        if (trimmed && !trimmed.startsWith('--')) {
          statements.push(trimmed);
        }
        currentStatement = '';
        i++;
        continue;
      }
    } else {
      // Check for end of dollar-quoted string
      if (char === '$') {
        const endTag = `$${dollarTag}$`;
        if (sql.substring(i, i + endTag.length) === endTag) {
          inDollarQuoted = false;
          currentStatement += endTag;
          i += endTag.length;
          continue;
        }
      }
    }

    currentStatement += char;
    i++;
  }

  // Add the final statement if exists
  const trimmed = currentStatement.trim();
  if (trimmed && !trimmed.startsWith('--')) {
    statements.push(trimmed);
  }

  return statements.filter(s => s.length > 0);
};

const ensureMigrationsTable = async () => {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version VARCHAR(255) PRIMARY KEY,
        applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        description TEXT
      )
    `);
    logger.info('Schema migrations table ensured');
  } catch (error) {
    logger.error('Failed to create schema_migrations table:', error);
    throw error;
  }
};

const getAppliedMigrations = async () => {
  try {
    const result = await query('SELECT version FROM schema_migrations ORDER BY version');
    return result.rows.map(row => row.version);
  } catch (error) {
    // Table might not exist yet, return empty array
    logger.warn('Could not get applied migrations, assuming fresh database');
    return [];
  }
};

const markMigrationAsApplied = async (version, description) => {
  await query(
    'INSERT INTO schema_migrations (version, description) VALUES ($1, $2) ON CONFLICT (version) DO NOTHING',
    [version, description]
  );
};

const checkTableExists = async (tableName) => {
  try {
    const result = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = $1
      )
    `, [tableName]);
    return result.rows[0].exists;
  } catch (error) {
    logger.warn(`Error checking if table ${tableName} exists:`, error);
    return false;
  }
};

const getMigrationFiles = async () => {
  const migrationsDir = path.join(__dirname, 'migrations');
  
  try {
    const files = await fs.readdir(migrationsDir);
    return files
      .filter(file => file.endsWith('.sql'))
      .sort()
      .map(file => ({
        version: file.split('_')[0],
        filename: file,
        path: path.join(migrationsDir, file)
      }));
  } catch (error) {
    logger.warn('Migrations directory not found, falling back to init.sql');
    return [];
  }
};

const runMigration = async (closePoolAfter = true) => {
  try {
    logger.info('Starting database migration...');

    // Test database connection
    const connected = await testConnection();
    if (!connected) {
      throw new Error('Could not connect to database');
    }

    // Get migration files
    const migrationFiles = await getMigrationFiles();
    
    if (migrationFiles.length === 0) {
      // Fallback to old init.sql approach
      logger.info('No migration files found, using init.sql');
      const initSqlPath = path.join(__dirname, 'init.sql');
      await executeSqlFile(initSqlPath);
    } else {
      // Ensure schema_migrations table exists for tracking
      await ensureMigrationsTable();
      // Run new migration system
      logger.info(`Found ${migrationFiles.length} migration files`);
      
      // Get already applied migrations
      const appliedMigrations = await getAppliedMigrations();
      logger.info('Applied migrations:', appliedMigrations);
      
      // Check if this is an existing database without migration tracking
      const hasDocumentsTable = await checkTableExists('documents');
      
      // Run pending migrations
      for (const migration of migrationFiles) {
        if (!appliedMigrations.includes(migration.version)) {
          // Special handling for migration 000 (initial schema)
          if (migration.version === '000' && hasDocumentsTable) {
            logger.info(`Migration ${migration.version}: documents table already exists, marking as applied`);
            const description = migration.filename
              .replace(/^\d+_/, '')
              .replace(/\.sql$/, '')
              .replace(/_/g, ' ');
            await markMigrationAsApplied(migration.version, description);
          } else {
            logger.info(`Running migration ${migration.version}: ${migration.filename}`);
            
            await executeSqlFile(migration.path);
            
            // Extract description from filename
            const description = migration.filename
              .replace(/^\d+_/, '')
              .replace(/\.sql$/, '')
              .replace(/_/g, ' ');
            
            await markMigrationAsApplied(migration.version, description);
            logger.info(`Migration ${migration.version} completed successfully`);
          }
        } else {
          logger.info(`Migration ${migration.version} already applied, skipping`);
        }
      }
    }

    logger.info('Database migration completed successfully');

    // Verify tables exist
    const tablesResult = await query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `);

    logger.info('Available tables:', {
      tables: tablesResult.rows.map((r) => r.table_name),
    });

    // Show migration status
    try {
      const migrationsResult = await query('SELECT version, description, applied_at FROM schema_migrations ORDER BY version');
      logger.info('Migration status:', {
        migrations: migrationsResult.rows
      });
    } catch (error) {
      logger.info('Migration tracking table not available');
    }

  } catch (error) {
    logger.error('Migration failed:', {
      error: error.message,
      stack: error.stack,
    });
    throw error;
  } finally {
    if (closePoolAfter) {
      await closePool();
    }
  }
};

// Run migration if this script is executed directly
if (require.main === module) {
  runMigration()
    .then(() => {
      logger.info('Migration completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { runMigration };
