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