const { query, testConnection, closePool } = require('./connection');
const { createLogger } = require('../logger');
const fs = require('fs').promises;
const path = require('path');

const logger = createLogger('database-migration');

const runMigration = async () => {
  try {
    logger.info('Starting database migration...');

    // Test database connection
    const connected = await testConnection();
    if (!connected) {
      throw new Error('Could not connect to database');
    }

    // Read and execute init.sql
    const initSqlPath = path.join(__dirname, 'init.sql');
    const initSql = await fs.readFile(initSqlPath, 'utf8');

    // Split by semicolons and execute each statement
    const statements = initSql
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
      if (statement.trim()) {
        logger.info(`Executing: ${statement.substring(0, 50)}...`);
        await query(statement);
      }
    }

    logger.info('Database migration completed successfully');

    // Verify tables exist
    const tablesResult = await query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `);

    logger.info('Created tables:', {
      tables: tablesResult.rows.map((r) => r.table_name),
    });
  } catch (error) {
    logger.error('Migration failed:', {
      error: error.message,
      stack: error.stack,
    });
    throw error;
  } finally {
    await closePool();
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
