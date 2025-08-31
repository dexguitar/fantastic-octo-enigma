const { v4: uuidv4 } = require('uuid');
const { query, transaction } = require('../../shared/database/connection');
const { createLogger } = require('../../shared/logger');

const logger = createLogger('document-model');

const DocumentStatus = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
};

const DocumentType = {
  IMAGE: 'image',
  TEXT: 'text',
};

const validateDocumentData = (data) => {
  const errors = [];

  if (
    !data.name ||
    typeof data.name !== 'string' ||
    data.name.trim().length === 0
  ) {
    errors.push('name is required and must be a non-empty string');
  }

  if (!data.type || typeof data.type !== 'string') {
    errors.push('type is required and must be a string');
  } else if (!Object.values(DocumentType).includes(data.type)) {
    errors.push(
      `type must be one of: ${Object.values(DocumentType).join(', ')}`
    );
  }

  if (
    !data.content ||
    typeof data.content !== 'string' ||
    data.content.trim().length === 0
  ) {
    errors.push('content is required and must be a non-empty string');
  }

  if (data.name && data.name.length > 255) {
    errors.push('name must be less than 255 characters');
  }

  if (data.content && data.content.length > 10000000) {
    // 10MB limit
    errors.push('content must be less than 10MB');
  }

  return errors;
};

const validateDocumentUpdate = (data) => {
  const errors = [];

  if (data.name !== undefined) {
    if (typeof data.name !== 'string' || data.name.trim().length === 0) {
      errors.push('name must be a non-empty string');
    }
    if (data.name.length > 255) {
      errors.push('name must be less than 255 characters');
    }
  }

  if (
    data.status !== undefined &&
    !Object.values(DocumentStatus).includes(data.status)
  ) {
    errors.push(
      `status must be one of: ${Object.values(DocumentStatus).join(', ')}`
    );
  }

  return errors;
};

const createDocument = async (data) => {
  const validationErrors = validateDocumentData(data);
  if (validationErrors.length > 0) {
    throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
  }

  try {
    const result = await query(
      `
            INSERT INTO documents (name, type, content, status, result)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, name, type, content, status, result, created_at, updated_at
        `,
      [data.name.trim(), data.type, data.content, DocumentStatus.PENDING, null]
    );

    const document = result.rows[0];

    // Convert database response to match original format
    return {
      id: document.id,
      name: document.name,
      type: document.type,
      content: document.content,
      status: document.status,
      createdAt: document.created_at,
      updatedAt: document.updated_at,
      result: document.result,
    };
  } catch (error) {
    logger.error('Failed to create document', { error: error.message, data });
    throw new Error(`Failed to create document: ${error.message}`);
  }
};

const getAllDocuments = async () => {
  try {
    const result = await query(`
            SELECT id, name, type, content, status, result, created_at, updated_at
            FROM documents
            ORDER BY created_at DESC
        `);

    return result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      type: row.type,
      content: row.content,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      result: row.result,
    }));
  } catch (error) {
    logger.error('Failed to get all documents', { error: error.message });
    throw new Error(`Failed to retrieve documents: ${error.message}`);
  }
};

const getDocumentById = async (id) => {
  if (!id || typeof id !== 'string') {
    throw new Error('Document ID is required and must be a string');
  }

  try {
    const result = await query(
      `
            SELECT id, name, type, content, status, result, created_at, updated_at
            FROM documents
            WHERE id = $1
        `,
      [id]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      id: row.id,
      name: row.name,
      type: row.type,
      content: row.content,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      result: row.result,
    };
  } catch (error) {
    logger.error('Failed to get document by ID', {
      error: error.message,
      documentId: id,
    });
    throw new Error(`Failed to retrieve document: ${error.message}`);
  }
};

const updateDocument = async (id, data) => {
  if (!id || typeof id !== 'string') {
    throw new Error('Document ID is required and must be a string');
  }

  const validationErrors = validateDocumentUpdate(data);
  if (validationErrors.length > 0) {
    throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
  }

  try {
    // Build dynamic UPDATE query based on provided fields
    const updateFields = [];
    const updateValues = [];
    let paramIndex = 1;

    if (data.name !== undefined) {
      updateFields.push(`name = $${paramIndex++}`);
      updateValues.push(data.name.trim());
    }

    if (data.status !== undefined) {
      updateFields.push(`status = $${paramIndex++}`);
      updateValues.push(data.status);
    }

    if (data.result !== undefined) {
      updateFields.push(`result = $${paramIndex++}`);
      updateValues.push(JSON.stringify(data.result));
    }

    if (updateFields.length === 0) {
      // No fields to update, just return current document
      return await getDocumentById(id);
    }

    // Add updated_at field
    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    updateValues.push(id); // For WHERE clause

    const updateQuery = `
            UPDATE documents 
            SET ${updateFields.join(', ')}
            WHERE id = $${paramIndex}
            RETURNING id, name, type, content, status, result, created_at, updated_at
        `;

    const result = await query(updateQuery, updateValues);

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      id: row.id,
      name: row.name,
      type: row.type,
      content: row.content,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      result: row.result,
    };
  } catch (error) {
    logger.error('Failed to update document', {
      error: error.message,
      documentId: id,
      data,
    });
    throw new Error(`Failed to update document: ${error.message}`);
  }
};

const deleteDocument = async (id) => {
  if (!id || typeof id !== 'string') {
    throw new Error('Document ID is required and must be a string');
  }

  try {
    const result = await query(
      `
            DELETE FROM documents 
            WHERE id = $1
        `,
      [id]
    );

    return result.rowCount > 0;
  } catch (error) {
    logger.error('Failed to delete document', {
      error: error.message,
      documentId: id,
    });
    throw new Error(`Failed to delete document: ${error.message}`);
  }
};

const updateDocumentStatus = async (id, status, result = null) => {
  if (!id || typeof id !== 'string') {
    throw new Error('Document ID is required and must be a string');
  }

  if (!Object.values(DocumentStatus).includes(status)) {
    throw new Error(
      `Status must be one of: ${Object.values(DocumentStatus).join(', ')}`
    );
  }

  try {
    const updateQuery = `
            UPDATE documents 
            SET status = $1, result = $2, updated_at = CURRENT_TIMESTAMP
            WHERE id = $3
            RETURNING id, name, type, content, status, result, created_at, updated_at
        `;

    const queryResult = await query(updateQuery, [
      status,
      result ? JSON.stringify(result) : null,
      id,
    ]);

    if (queryResult.rows.length === 0) {
      return null;
    }

    const row = queryResult.rows[0];
    return {
      id: row.id,
      name: row.name,
      type: row.type,
      content: row.content,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      result: row.result,
    };
  } catch (error) {
    logger.error('Failed to update document status', {
      error: error.message,
      documentId: id,
      status,
      result,
    });
    throw new Error(`Failed to update document status: ${error.message}`);
  }
};

module.exports = {
  DocumentStatus,
  DocumentType,
  createDocument,
  getAllDocuments,
  getDocumentById,
  updateDocument,
  deleteDocument,
  updateDocumentStatus,
  validateDocumentData,
  validateDocumentUpdate,
};
