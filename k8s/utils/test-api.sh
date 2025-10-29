#!/bin/bash

API_URL="http://localhost:30000"

echo "======================================"
echo "Testing API Endpoints"
echo "======================================"
echo ""

GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo "1. Testing Health Endpoint..."
HEALTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" $API_URL/health)
if [ "$HEALTH_RESPONSE" -eq 200 ]; then
    echo -e "${GREEN}✓ Health check passed${NC}"
else
    echo -e "${RED}✗ Health check failed (HTTP $HEALTH_RESPONSE)${NC}"
fi
echo ""

echo "2. Creating a test document..."
CREATE_RESPONSE=$(curl -s -X POST $API_URL/api/documents \
  -H "Content-Type: application/json" \
  -d '{
    "name": "test-k8s-document.txt",
    "type": "text",
    "content": "This is a test document created from Kubernetes deployment",
    "keywords": "kubernetes,test,automation"
  }')

if echo "$CREATE_RESPONSE" | jq -e '.id' > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Document created successfully${NC}"
    DOCUMENT_ID=$(echo "$CREATE_RESPONSE" | jq -r '.id')
    echo "  Document ID: $DOCUMENT_ID"
else
    echo -e "${RED}✗ Failed to create document${NC}"
    echo "  Response: $CREATE_RESPONSE"
    exit 1
fi
echo ""

echo "3. Getting all documents..."
GET_ALL_RESPONSE=$(curl -s $API_URL/api/documents)
DOCUMENT_COUNT=$(echo "$GET_ALL_RESPONSE" | jq '. | length')
if [ "$DOCUMENT_COUNT" -eq 0 ]; then
    echo -e "${RED}✗ No documents found${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Retrieved $DOCUMENT_COUNT documents${NC}"
echo ""

sleep 5

echo "4. Getting specific document..."
GET_ONE_RESPONSE=$(curl -s $API_URL/api/documents/$DOCUMENT_ID)
if echo "$GET_ONE_RESPONSE" | jq -e '.id' > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Document retrieved successfully${NC}"
    echo "  Name: $(echo "$GET_ONE_RESPONSE" | jq -r '.name')"
    echo "  Type: $(echo "$GET_ONE_RESPONSE" | jq -r '.type')"
    echo "  Status: $(echo "$GET_ONE_RESPONSE" | jq -r '.status')"
else
    echo -e "${RED}✗ Failed to retrieve document${NC}"
fi
echo ""

echo "5. Updating document..."
UPDATE_RESPONSE=$(curl -s -X PUT $API_URL/api/documents/$DOCUMENT_ID \
  -H "Content-Type: application/json" \
  -d '{
    "name": "updated-k8s-document.txt"
  }')

if echo "$UPDATE_RESPONSE" | jq -e '.id' > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Document updated successfully${NC}"
    echo "  New name: $(echo "$UPDATE_RESPONSE" | jq -r '.name')"
else
    echo -e "${RED}✗ Failed to update document${NC}"
fi
echo ""

echo "6. Deleting document..."
DELETE_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE $API_URL/api/documents/$DOCUMENT_ID)
if [ "$DELETE_RESPONSE" -eq 200 ] || [ "$DELETE_RESPONSE" -eq 204 ]; then
    echo -e "${GREEN}✓ Document deleted successfully${NC}"
else
    echo -e "${RED}✗ Failed to delete document (HTTP $DELETE_RESPONSE)${NC}"
fi
echo ""

echo "======================================"
echo "API Testing Complete!"
echo "======================================"
echo ""
echo "You can also test the API using Swagger UI:"
echo "  $API_URL/api-docs"
echo ""

