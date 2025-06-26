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
curl -X GET http://localhost:3000/api/documents
```

### Getting a Document by ID

```bash
curl -X GET http://localhost:3000/api/documents/document_id_here
```