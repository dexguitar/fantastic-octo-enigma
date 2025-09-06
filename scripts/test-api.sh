#!/bin/bash

# API Testing Script for GitHub Actions
# Usage: ./scripts/test-api.sh [base_url]

BASE_URL=${1:-"http://localhost:3000"}

echo "🧪 Testing Document Processing API at $BASE_URL"
echo "=================================================="

# Test health endpoints
echo "1. Testing Health Endpoints..."
curl -f "$BASE_URL/health" && echo "✅ API Gateway health OK" || echo "❌ API Gateway health failed"
curl -f "http://localhost:3001/health" && echo "✅ Image Service health OK" || echo "❌ Image Service health failed"  
curl -f "http://localhost:3002/health" && echo "✅ Text Service health OK" || echo "❌ Text Service health failed"

echo ""
echo "2. Testing API Endpoints..."

# Test GET documents
echo "Testing GET /api/documents..."
RESPONSE=$(curl -s -w "%{http_code}" "$BASE_URL/api/documents")
STATUS=${RESPONSE: -3}
BODY=${RESPONSE%???}
echo "Status: $STATUS"
echo "Response: $BODY"

# Test Swagger
echo ""
echo "3. Testing API Documentation..."
curl -f "$BASE_URL/api-docs/" -s > /dev/null && echo "✅ Swagger UI accessible" || echo "❌ Swagger UI not accessible"
curl -f "$BASE_URL/api-docs.json" -s > /dev/null && echo "✅ OpenAPI spec accessible" || echo "❌ OpenAPI spec not accessible"

# Show available endpoints
echo ""
echo "4. Available API Endpoints:"
curl -s "$BASE_URL/api-docs.json" | jq -r '.paths | keys[]' 2>/dev/null || echo "Could not fetch endpoint list"

# Test document creation
echo ""
echo "5. Testing Document Creation..."
CREATE_RESPONSE=$(curl -s -X POST "$BASE_URL/api/documents" \
  -H "Content-Type: application/json" \
  -d '{"title": "CI Test Document", "content": "This is a test document created during CI", "type": "text"}' \
  -w "%{http_code}")
  
CREATE_STATUS=${CREATE_RESPONSE: -3}
CREATE_BODY=${CREATE_RESPONSE%???}
echo "Create Status: $CREATE_STATUS"
echo "Create Response: $CREATE_BODY"

if [ "$CREATE_STATUS" -eq 201 ] || [ "$CREATE_STATUS" -eq 200 ]; then
  echo "✅ Document creation successful"
  
  # Extract document ID if possible
  DOC_ID=$(echo "$CREATE_BODY" | jq -r '.id // .documentId // empty' 2>/dev/null)
  
  if [ ! -z "$DOC_ID" ] && [ "$DOC_ID" != "null" ]; then
    echo "📄 Created document ID: $DOC_ID"
    
    # Test GET specific document
    echo "Testing GET /api/documents/$DOC_ID..."
    curl -s "$BASE_URL/api/documents/$DOC_ID" | jq '.' || echo "Could not fetch created document"
  fi
else
  echo "⚠️  Document creation returned status $CREATE_STATUS"
fi

echo ""
echo "🎉 API testing completed!"
echo "=================================================="

