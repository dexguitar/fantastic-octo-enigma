const { v4: uuidv4 } = require('uuid');

// In-memory storage for documents
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

const createDocument = (data) => {
    const id = uuidv4();
    const document = {
        id,
        name: data.name,
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
    return documents.get(id);
};

const updateDocument = (id, data) => {
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
    if (!documents.has(id)) {
        return false;
    }

    return documents.delete(id);
};

const updateDocumentStatus = (id, status, result = null) => {
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
}; 