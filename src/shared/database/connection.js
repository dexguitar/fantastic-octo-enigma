const { Pool } = require('pg');
const { createLogger } = require('../logger');

const logger = createLogger('database');

// Database configuration from environment variables
const dbConfig = process.env.DATABASE_URL
  ? {
      // Railway-style connection string
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      // Connection pool settings
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    }
  : {
      // Individual environment variables (local development)
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'document_processing',
      user: process.env.DB_USER || 'admin',
      password: process.env.DB_PASSWORD || 'admin123',
      // Connection pool settings
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
      ssl: false,
    };

// Create connection pool
const pool = new Pool(dbConfig);

// Handle pool errors
pool.on('error', (err, client) => {
  logger.error('Unexpected error on idle client', {
    error: err.message,
    stack: err.stack,
  });
});

// Handle pool connection events
pool.on('connect', (client) => {
  logger.info('Database client connected');
});

pool.on('acquire', (client) => {
  logger.debug('Database client acquired from pool');
});

pool.on('remove', (client) => {
  logger.debug('Database client removed from pool');
});

// Test database connection
const testConnection = async () => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as current_time');
    logger.info('Database connection successful', {
      currentTime: result.rows[0].current_time,
      poolTotalCount: pool.totalCount,
      poolIdleCount: pool.idleCount,
      poolWaitingCount: pool.waitingCount,
    });
    client.release();
    return true;
  } catch (error) {
    logger.error('Database connection failed', {
      error: error.message,
      stack: error.stack,
      config: { ...dbConfig, password: '***' }, // Hide password in logs
    });
    return false;
  }
};

// Graceful shutdown
const closePool = async () => {
  try {
    await pool.end();
    logger.info('Database pool closed gracefully');
  } catch (error) {
    logger.error('Error closing database pool', { error: error.message });
  }
};

// Helper function for executing queries with error handling
const query = async (text, params = []) => {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;

    logger.debug('Database query executed', {
      query: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
      duration: `${duration}ms`,
      rows: result.rowCount,
    });

    return result;
  } catch (error) {
    const duration = Date.now() - start;
    logger.error('Database query failed', {
      query: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
      params: params,
      duration: `${duration}ms`,
      error: error.message,
      stack: error.stack,
    });
    throw error;
  }
};

// Helper function for transactions
const transaction = async (callback) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  pool,
  query,
  transaction,
  testConnection,
  closePool,
};
