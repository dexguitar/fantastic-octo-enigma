const { v4: uuidv4 } = require('uuid');

const documents = new Map();

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

    if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
        errors.push('name is required and must be a non-empty string');
    }

    if (!data.type || typeof data.type !== 'string') {
        errors.push('type is required and must be a string');
    } else if (!Object.values(DocumentType).includes(data.type)) {
        errors.push(`type must be one of: ${Object.values(DocumentType).join(', ')}`);
    }

    if (!data.content || typeof data.content !== 'string' || data.content.trim().length === 0) {
        errors.push('content is required and must be a non-empty string');
    }

    if (data.name && data.name.length > 255) {
        errors.push('name must be less than 255 characters');
    }

    if (data.content && data.content.length > 10000000) { // 10MB limit
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

    if (data.status !== undefined && !Object.values(DocumentStatus).includes(data.status)) {
        errors.push(`status must be one of: ${Object.values(DocumentStatus).join(', ')}`);
    }

    return errors;
};

const createDocument = (data) => {
    const validationErrors = validateDocumentData(data);
    if (validationErrors.length > 0) {
        throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
    }

    const id = uuidv4();
    const document = {
        id,
        name: data.name.trim(),
        type: data.type,
        content: data.content,
        status: DocumentStatus.PENDING,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        result: null,
    };

    documents.set(id, document);
    return document;
};

const getAllDocuments = () => {
    return Array.from(documents.values());
};

const getDocumentById = (id) => {
    if (!id || typeof id !== 'string') {
        throw new Error('Document ID is required and must be a string');
    }
    return documents.get(id);
};

const updateDocument = (id, data) => {
    if (!id || typeof id !== 'string') {
        throw new Error('Document ID is required and must be a string');
    }

    const validationErrors = validateDocumentUpdate(data);
    if (validationErrors.length > 0) {
        throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
    }

    const document = documents.get(id);
    if (!document) {
        return null;
    }

    const updatedDocument = {
        ...document,
        ...data,
        updatedAt: new Date().toISOString(),
    };

    documents.set(id, updatedDocument);
    return updatedDocument;
};

const deleteDocument = (id) => {
    if (!id || typeof id !== 'string') {
        throw new Error('Document ID is required and must be a string');
    }

    if (!documents.has(id)) {
        return false;
    }

    return documents.delete(id);
};

const updateDocumentStatus = (id, status, result = null) => {
    if (!id || typeof id !== 'string') {
        throw new Error('Document ID is required and must be a string');
    }

    if (!Object.values(DocumentStatus).includes(status)) {
        throw new Error(`Status must be one of: ${Object.values(DocumentStatus).join(', ')}`);
    }

    const document = documents.get(id);
    if (!document) {
        return null;
    }

    const updatedDocument = {
        ...document,
        status,
        updatedAt: new Date().toISOString(),
        ...(result && { result }),
    };

    documents.set(id, updatedDocument);
    return updatedDocument;
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