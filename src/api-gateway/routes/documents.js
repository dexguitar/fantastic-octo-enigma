const express = require('express');
const router = express.Router();
const documentsController = require('../controllers/documents');

/**
 * @swagger
 * components:
 *   schemas:
 *     Document:
 *       type: object
 *       required:
 *         - name
 *         - type
 *         - content
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated ID of the document
 *         name:
 *           type: string
 *           description: The name of the document
 *         type:
 *           type: string
 *           enum: [image, text]
 *           description: The type of document
 *         content:
 *           type: string
 *           description: The content of the document (base64 encoded for images)
 *         keywords:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of user-provided keywords for the document
 *           maxItems: 20
 *         status:
 *           type: string
 *           enum: [pending, processing, completed, failed]
 *           description: The status of the document processing
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The date the document was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: The date the document was last updated
 *         result:
 *           type: object
 *           description: The processing result (null until processing is complete)
 *       example:
 *         id: 550e8400-e29b-41d4-a716-446655440000
 *         name: example.txt
 *         type: text
 *         keywords: ["document", "processing", "example"]
 *         status: completed
 *         createdAt: 2023-01-01T00:00:00.000Z
 *         updatedAt: 2023-01-01T00:01:00.000Z
 *         result:
 *           analysis: "Sample analysis result"
 *           extractedKeywords: ["sample", "example", "test"]
 */

/**
 * @swagger
 * tags:
 *   name: Documents
 *   description: Document management API
 */

/**
 * @swagger
 * /api/documents:
 *   post:
 *     summary: Create a new document
 *     tags: [Documents]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - type
 *               - content
 *             properties:
 *               name:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [image, text]
 *               content:
 *                 type: string
 *               keywords:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Optional array of keywords for the document
 *                 maxItems: 20
 *     responses:
 *       201:
 *         description: The document was successfully created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Document'
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Server error
 */
router.post('/', documentsController.createDocument);

/**
 * @swagger
 * /api/documents:
 *   get:
 *     summary: Get all documents
 *     tags: [Documents]
 *     responses:
 *       200:
 *         description: List of all documents
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Document'
 *       500:
 *         description: Server error
 */
router.get('/', documentsController.getAllDocuments);

/**
 * @swagger
 * /api/documents/{id}:
 *   get:
 *     summary: Get a document by ID
 *     tags: [Documents]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The document ID
 *     responses:
 *       200:
 *         description: Document found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Document'
 *       404:
 *         description: Document not found
 *       500:
 *         description: Server error
 */
router.get('/:id', documentsController.getDocumentById);

/**
 * @swagger
 * /api/documents/{id}:
 *   put:
 *     summary: Update a document
 *     tags: [Documents]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The document ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               keywords:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Optional array of keywords for the document
 *                 maxItems: 20
 *     responses:
 *       200:
 *         description: Document updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Document'
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Document not found
 *       500:
 *         description: Server error
 */
router.put('/:id', documentsController.updateDocument);

/**
 * @swagger
 * /api/documents/{id}:
 *   delete:
 *     summary: Delete a document
 *     tags: [Documents]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The document ID
 *     responses:
 *       204:
 *         description: Document deleted
 *       404:
 *         description: Document not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', documentsController.deleteDocument);

module.exports = router;
