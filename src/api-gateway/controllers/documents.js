const { createLogger } = require('../../shared/logger');
const { sendMessage } = require('../../shared/kafka');
const {
    createDocument,
    getAllDocuments,
    getDocumentById,
    updateDocument,
    deleteDocument,
    updateDocumentStatus,
    DocumentStatus,
    DocumentType
} = require('../models/document');
const config = require('../config/environment');

const logger = createLogger('document-controller');

exports.createDocument = async (req, res, next) => {
    try {
        const { name, type, content } = req.body;

        if (!name || !type || !content) {
            return res.status(400).json({
                error: 'Missing required fields: name, type, and content are required'
            });
        }

        if (!Object.values(DocumentType).includes(type)) {
            return res.status(400).json({
                error: `Invalid document type. Must be one of: ${Object.values(DocumentType).join(', ')}`
            });
        }

        const document = createDocument({ name, type, content });
        logger.info(`Document created: ${document.id}`);

        const topic = type === DocumentType.IMAGE
            ? config.topics.imageProcessing
            : config.topics.textProcessing;

        await sendMessage(topic, {
            documentId: document.id,
            name: document.name,
            type: document.type,
            content: document.content,
        });

        const updatedDocument = updateDocumentStatus(document.id, DocumentStatus.PROCESSING);
        
        const response = {
            id: updatedDocument.id,
            name: updatedDocument.name,
            type: updatedDocument.type,
            status: updatedDocument.status,
            createdAt: updatedDocument.createdAt,
            updatedAt: updatedDocument.updatedAt,
        };

        res.status(201).json(response);
    } catch (error) {
        logger.error('Error creating document:', error);
        next(error);
    }
};

exports.getAllDocuments = (req, res, next) => {
    try {
        const documents = getAllDocuments();
        const includeContent = req.query.includeContent === 'true';

        const sanitizedDocuments = documents.map(doc => {
            if (includeContent) {
                return doc;
            }
            
            const { content, ...rest } = doc;
            return rest;
        });

        res.status(200).json(sanitizedDocuments);
    } catch (error) {
        logger.error('Error getting all documents:', error);
        next(error);
    }
};

exports.getDocumentById = (req, res, next) => {
    try {
        const { id } = req.params;
        const document = getDocumentById(id);

        if (!document) {
            return res.status(404).json({ error: `Document with ID ${id} not found` });
        }

        const includeContent = req.query.includeContent === 'true';
        
        if (includeContent) {
            return res.status(200).json(document);
        }

        const { content, ...sanitizedDocument } = document;
        res.status(200).json(sanitizedDocument);
    } catch (error) {
        logger.error(`Error getting document ${req.params.id}:`, error);
        next(error);
    }
};

exports.updateDocument = (req, res, next) => {
    try {
        const { id } = req.params;
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Missing required field: name' });
        }

        const updatedDocument = updateDocument(id, { name });

        if (!updatedDocument) {
            return res.status(404).json({ error: `Document with ID ${id} not found` });
        }

        const { content, ...sanitizedDocument } = updatedDocument;
        res.status(200).json(sanitizedDocument);
    } catch (error) {
        logger.error(`Error updating document ${req.params.id}:`, error);
        next(error);
    }
};

exports.deleteDocument = (req, res, next) => {
    try {
        const { id } = req.params;
        const deleted = deleteDocument(id);

        if (!deleted) {
            return res.status(404).json({ error: `Document with ID ${id} not found` });
        }

        logger.info(`Document deleted: ${id}`);
        res.status(204).send();
    } catch (error) {
        logger.error(`Error deleting document ${req.params.id}:`, error);
        next(error);
    }
};

exports.processDocumentResult = (documentId, result) => {
    try {
        logger.info(`Processing result for document ${documentId}`);

        const updatedDocument = updateDocumentStatus(
            documentId,
            DocumentStatus.COMPLETED,
            result
        );

        if (!updatedDocument) {
            logger.error(`Document with ID ${documentId} not found when processing result`);
            return false;
        }

        logger.info(`Document ${documentId} processed successfully`);
        return true;
    } catch (error) {
        logger.error(`Error processing result for document ${documentId}:`, error);
        return false;
    }
}; 