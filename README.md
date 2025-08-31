# Document Processing System

A microservices-based document processing system built with Node.js, Kafka, and PostgreSQL. The system processes text and image documents asynchronously using message queues.

## Architecture

- **API Gateway**: Express.js REST API for document management
- **Image Service**: Microservice for image processing
- **Text Service**: Microservice for text processing
- **PostgreSQL**: Database for persistent document storage
- **Kafka**: Message broker for async communication
- **Docker**: Containerized deployment

## Quick Start

### 1. Initialize the Docker Environment

```bash
# Make the setup script executable
chmod +x docker-setup.sh

# Initialize the Docker environment
./docker-setup.sh init
```

This will check if Docker and Docker Compose are installed, create the necessary environment files, and set up the logs directory.

### 2. Setup prod env

```bash
./docker-setup.sh prod

# Start the services
./docker-run.sh start
```

### 3. Accessing the Services

After starting the services:

- **API Gateway**: http://localhost:3000
- **API Documentation**: http://localhost:3000/api-docs
- **Kafka UI**: http://localhost:8080
- **PostgreSQL**: localhost:5432 (database: `document_processing`, user: `admin`)

```bash
# Start Zookeeper
bin/zookeeper-server-start.sh config/zookeeper.properties

# Start Kafka
bin/kafka-server-start.sh config/server.properties

# Create required topics
bin/kafka-topics.sh --create --topic document-image-processing --bootstrap-server localhost:9092 --partitions 1 --replication-factor 1
bin/kafka-topics.sh --create --topic document-text-processing --bootstrap-server localhost:9092 --partitions 1 --replication-factor 1
bin/kafka-topics.sh --create --topic document-processing-results --bootstrap-server localhost:9092 --partitions 1 --replication-factor 1
```

### Start the Services

You can start all services with:

```bash
# Start API Gateway
npm run start:api

# Start Image Processing Service
npm run start:image

# Start Text Processing Service
npm run start:text
```

## PostgreSQL Database

### Database Schema

The system uses a single `documents` table with the following structure:

```sql
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('image', 'text')),
    content TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    result JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### Environment Variables

The following environment variables are used for database connection:

- `DATABASE_URL`: Full PostgreSQL connection string
- `DB_HOST`: Database host (default: localhost)
- `DB_PORT`: Database port (default: 5432)
- `DB_NAME`: Database name (default: document_processing)
- `DB_USER`: Database user (default: admin)
- `DB_PASSWORD`: Database password (default: admin123)

### Database Commands

```bash
# Run database migration manually
npm run db:migrate

# Reset database (DROP and recreate schema)
npm run db:reset

# Connect to database from host
psql postgresql://admin:admin123@localhost:5432/document_processing

# Connect to database via Docker
docker-compose exec postgres psql -U admin -d document_processing
```

### Database Operations

All document operations are now async and use PostgreSQL:

```javascript
// Create document
const document = await createDocument({
  name: 'My Document',
  type: 'text',
  content: 'Document content here',
});

// Get all documents
const documents = await getAllDocuments();

// Get document by ID
const document = await getDocumentById('uuid-here');

// Update document
const updated = await updateDocument('uuid-here', { name: 'New Name' });

// Delete document
const deleted = await deleteDocument('uuid-here');

// Update document status
const updated = await updateDocumentStatus('uuid-here', 'completed', {
  result: 'data',
});
```

### Connection Pool

The system uses a connection pool with the following settings:

- **Max connections**: 20
- **Idle timeout**: 30 seconds
- **Connection timeout**: 5 seconds
- **SSL**: Enabled in production

### Troubleshooting

#### Connection Issues

1. Ensure PostgreSQL container is running: `docker-compose ps postgres`
2. Check PostgreSQL logs: `docker-compose logs postgres`
3. Verify environment variables are correct
4. Test connection manually: `npm run db:migrate`

#### Performance Issues

1. Check connection pool status in logs
2. Monitor query execution times
3. Consider adding indexes for frequently queried fields

#### Data Issues

1. Access database directly: `docker-compose exec postgres psql -U admin -d document_processing`
2. Check table contents: `SELECT * FROM documents;`
3. Reset database if needed: `npm run db:reset`

## API Documentation

API documentation is available at `http://localhost:3000/api-docs` when the API Gateway is running.

## API Endpoints

### Documents

- `POST /api/documents`: Create a new document
- `GET /api/documents`: Get all documents
- `GET /api/documents/:id`: Get a document by ID
- `PUT /api/documents/:id`: Update a document
- `DELETE /api/documents/:id`: Delete a document

### Query Parameters

#### includeContent

By default, document content is excluded from GET responses to reduce payload size. Use `includeContent=true` to include the full document content in the response.

- `GET /api/documents?includeContent=true`: Get all documents with content
- `GET /api/documents/:id?includeContent=true`: Get a document by ID with content

## Example Usage

### Creating a Text Document

```bash
curl -X POST http://localhost:3000/api/documents \
  -H "Content-Type: application/json" \
  -d '{
    "name": "sample.txt",
    "type": "text",
    "content": "This is a sample text document for processing."
  }'
```

### Creating an Image Document

```bash
curl -X POST http://localhost:3000/api/documents \
  -H "Content-Type: application/json" \
  -d '{
    "name": "sample.jpg",
    "type": "image",
    "content": "base64encodedimagedata"
  }'
```

### Getting All Documents

```bash
# Get all documents (without content)
curl -X GET http://localhost:3000/api/documents

# Get all documents with content included
curl -X GET http://localhost:3000/api/documents?includeContent=true
```

### Getting a Document by ID

```bash
# Get a document by ID (without content)
curl -X GET http://localhost:3000/api/documents/document_id_here

# Get a document by ID with content included
curl -X GET http://localhost:3000/api/documents/document_id_here?includeContent=true
```

### Example Response Formats

#### Without Content (Default)

```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "name": "sample.txt",
  "type": "text",
  "status": "completed",
  "createdAt": "2023-01-01T00:00:00.000Z",
  "updatedAt": "2023-01-01T00:01:00.000Z",
  "result": {
    "analysis": "Text analysis complete",
    "statistics": {
      "wordCount": 245,
      "characterCount": 1337
    }
  }
}
```

#### With Content (includeContent=true)

```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "name": "sample.txt",
  "type": "text",
  "content": "This is a sample text document for processing.",
  "status": "completed",
  "createdAt": "2023-01-01T00:00:00.000Z",
  "updatedAt": "2023-01-01T00:01:00.000Z",
  "result": {
    "analysis": "Text analysis complete",
    "statistics": {
      "wordCount": 245,
      "characterCount": 1337
    }
  }
}
```
