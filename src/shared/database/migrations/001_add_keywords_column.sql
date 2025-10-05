-- Migration: Add keywords column to documents table
-- Version: 001
-- Description: Adds a keywords column to store user-provided keywords for documents

-- Add keywords column to documents table
ALTER TABLE documents 
ADD COLUMN IF NOT EXISTS keywords TEXT[];

-- Add index on keywords for better search performance
CREATE INDEX IF NOT EXISTS idx_documents_keywords ON documents USING GIN (keywords);

-- Add comment to the column
COMMENT ON COLUMN documents.keywords IS 'Array of user-provided keywords for the document';
