# Keywords Column Migration

This document describes the addition of a `keywords` column to the documents table, allowing users to provide keywords when creating and updating documents.

## Changes Made

### 1. Database Migration

- **Migration file**: `src/shared/database/migrations/001_add_keywords_column.sql`
  - Adds a `keywords` column of type `TEXT[]` (array of text) to the documents table
  - Creates a GIN index on the keywords column for efficient searching
  - Adds a column comment for documentation

- **Migration system**: Updated `src/shared/database/migrate.js`
  - Enhanced to support multiple migration files
  - Added migration tracking with `schema_migrations` table
  - Maintains backward compatibility with existing `init.sql`

### 2. Application Updates

- **Document Model** (`src/api-gateway/models/document.js`):
  - Added keywords validation (optional array of strings, max 20 items, max 50 chars each)
  - Updated all database queries to include `keywords` field
  - Updated all return objects to include `keywords` array

- **Document Controller** (`src/api-gateway/controllers/documents.js`):
  - Modified `createDocument` to accept optional `keywords` field
  - Modified `updateDocument` to accept optional `keywords` field
  - Updated validation to require at least one field (name or keywords) for updates

- **API Documentation** (`src/api-gateway/routes/documents.js`):
  - Updated Swagger schema to include `keywords` field
  - Added `keywords` to example responses
  - Updated request body schemas for POST and PUT endpoints

## How to Apply the Migration

### Option 1: Run Migration Script

```bash
# Apply all pending migrations
npm run db:migrate
```

### Option 2: Manual Database Update

If you prefer to apply the migration manually:

```sql
-- Connect to your PostgreSQL database and run:
ALTER TABLE documents
ADD COLUMN IF NOT EXISTS keywords TEXT[];

CREATE INDEX IF NOT EXISTS idx_documents_keywords
ON documents USING GIN (keywords);

COMMENT ON COLUMN documents.keywords
IS 'Array of user-provided keywords for the document';
```

## API Usage Examples

### Create Document with Keywords

**POST** `/api/documents`

```json
{
  "name": "my-document.txt",
  "type": "text",
  "content": "This is the document content",
  "keywords": ["important", "analysis", "report"]
}
```

**Response:**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "my-document.txt",
  "type": "text",
  "status": "processing",
  "keywords": ["important", "analysis", "report"],
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

### Update Document Keywords

**PUT** `/api/documents/{id}`

```json
{
  "name": "updated-document-name.txt",
  "keywords": ["updated", "keywords", "list"]
}
```

### Get Documents with Keywords

**GET** `/api/documents`

All documents will now include the `keywords` field in the response:

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "example.txt",
    "type": "text",
    "status": "completed",
    "keywords": ["important", "analysis", "report"],
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:31:00.000Z",
    "result": {
      "analysis": "Document analysis result",
      "extractedKeywords": ["document", "content", "text"]
    }
  }
]
```

## Validation Rules

### Keywords Field Validation:

- **Type**: Array of strings
- **Optional**: Can be omitted or set to empty array `[]`
- **Maximum items**: 20 keywords per document
- **Maximum length**: 50 characters per keyword
- **Minimum length**: 1 character per keyword (no empty strings)
- **Trimming**: Leading/trailing whitespace is automatically removed

### Examples of Valid Keywords:

```json
{
  "keywords": ["tag1", "tag2", "category"]
}
```

### Examples of Invalid Keywords:

```json
{
  "keywords": "not-an-array"  // Error: must be an array
}

{
  "keywords": ["", "valid"]  // Error: empty string not allowed
}

{
  "keywords": ["a".repeat(51)]  // Error: keyword too long (>50 chars)
}

{
  "keywords": new Array(21).fill("tag")  // Error: too many keywords (>20)
}
```

## Database Schema

After migration, the `documents` table will have this structure:

```sql
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL CHECK (char_length(trim(name)) > 0),
    type VARCHAR(50) NOT NULL CHECK (type IN ('image', 'text')),
    content TEXT NOT NULL CHECK (char_length(trim(content)) > 0),
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    result JSONB,
    keywords TEXT[], -- NEW COLUMN
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_documents_status ON documents(status);
CREATE INDEX idx_documents_type ON documents(type);
CREATE INDEX idx_documents_created_at ON documents(created_at DESC);
CREATE INDEX idx_documents_keywords ON documents USING GIN (keywords); -- NEW INDEX
```

## Future Enhancements

The keywords functionality enables several future enhancements:

1. **Search by Keywords**:

   ```sql
   SELECT * FROM documents
   WHERE keywords @> ARRAY['search-term'];
   ```

2. **Keyword Analytics**:

   ```sql
   SELECT keyword, COUNT(*)
   FROM documents, unnest(keywords) AS keyword
   GROUP BY keyword
   ORDER BY COUNT(*) DESC;
   ```

3. **Tag-based Filtering**:
   - Add GET `/api/documents?keywords=tag1,tag2` endpoint
   - Support keyword-based document organization

4. **Keyword Suggestions**:
   - Provide autocomplete for commonly used keywords
   - Suggest keywords based on document content analysis

## Testing

To test the new functionality:

1. **Run the migration**: `npm run db:migrate`
2. **Start the application**: `npm run start`
3. **Access Swagger UI**: Visit `https://fantastic-octo-enigma-production-81ae.up.railway.app/api-docs`
4. **Test the endpoints** using the examples above

The Swagger UI will now show the updated API documentation with the `keywords` field included in all relevant endpoints.

## Backward Compatibility

- ✅ Existing documents without keywords will have `keywords: []` (empty array)
- ✅ Existing API calls without keywords will continue to work
- ✅ The migration is non-destructive and can be safely applied to production
- ✅ All existing functionality remains unchanged

## Rollback

If needed, the migration can be rolled back by removing the column:

```sql
-- WARNING: This will permanently delete all keyword data
DROP INDEX IF EXISTS idx_documents_keywords;
ALTER TABLE documents DROP COLUMN IF EXISTS keywords;
```

## API Reference

### Updated Endpoints

#### POST /api/documents

Create a new document with optional keywords.

**Request Body:**

```json
{
  "name": "string (required)",
  "type": "text|image (required)",
  "content": "string (required)",
  "keywords": ["string"] // optional, max 20 items, max 50 chars each
}
```

#### PUT /api/documents/{id}

Update document name and/or keywords.

**Request Body:**

```json
{
  "name": "string (optional)",
  "keywords": ["string"] // optional, max 20 items, max 50 chars each
}
```

Note: At least one field (name or keywords) is required for updates.

#### GET /api/documents

#### GET /api/documents/{id}

Both endpoints now include the `keywords` field in their responses:

**Response:**

```json
{
  "id": "uuid",
  "name": "string",
  "type": "text|image",
  "status": "pending|processing|completed|failed",
  "keywords": ["string"], // NEW FIELD
  "createdAt": "datetime",
  "updatedAt": "datetime",
  "result": "object|null"
}
```

## Migration Status Tracking

The migration system now tracks applied migrations in the `schema_migrations` table:

```sql
SELECT * FROM schema_migrations ORDER BY version;
```

Expected output:

```
version |     description     |        applied_at
--------+--------------------+---------------------------
000     | Initial schema     | 2024-01-15 10:00:00+00
001     | add keywords column| 2024-01-15 10:01:00+00
```

This ensures migrations are only applied once and provides an audit trail of database changes.
