/*
  # Fix zIndex and hidden properties for story page elements

  This migration adds zIndex and hidden properties to existing story page elements
  that may be missing these properties.
*/

-- Update existing story pages to add zIndex and hidden properties to elements
-- First, handle pages that have elements but missing zIndex/hidden properties
UPDATE story_pages 
SET content = jsonb_set(
  content,
  '{elements}',
  (
    WITH numbered_elements AS (
      SELECT 
        element || jsonb_build_object(
          'zIndex', COALESCE((element->>'zIndex')::int, (ord - 1)),
          'hidden', COALESCE((element->>'hidden')::boolean, false)
        ) as updated_element
      FROM jsonb_array_elements(content->'elements') WITH ORDINALITY AS t(element, ord)
    )
    SELECT jsonb_agg(updated_element)
    FROM numbered_elements
  )
)
WHERE content ? 'elements' 
  AND jsonb_array_length(content->'elements') > 0
  AND EXISTS (
    SELECT 1 
    FROM jsonb_array_elements(content->'elements') AS element
    WHERE element->>'zIndex' IS NULL OR element->>'hidden' IS NULL
  );

-- Ensure all elements have sequential zIndex values starting from 0
-- This handles cases where zIndex values might be inconsistent
UPDATE story_pages 
SET content = jsonb_set(
  content,
  '{elements}',
  (
    WITH reindexed_elements AS (
      SELECT 
        (element - 'zIndex') || jsonb_build_object('zIndex', (ord - 1)) as updated_element
      FROM jsonb_array_elements(content->'elements') WITH ORDINALITY AS t(element, ord)
    )
    SELECT jsonb_agg(updated_element)
    FROM reindexed_elements
  )
)
WHERE content ? 'elements' 
  AND jsonb_array_length(content->'elements') > 0;

-- Add default hidden property to any elements that still don't have it
UPDATE story_pages 
SET content = jsonb_set(
  content,
  '{elements}',
  (
    SELECT jsonb_agg(
      CASE 
        WHEN element ? 'hidden' THEN element
        ELSE element || jsonb_build_object('hidden', false)
      END
    )
    FROM jsonb_array_elements(content->'elements') AS element
  )
)
WHERE content ? 'elements' 
  AND jsonb_array_length(content->'elements') > 0
  AND EXISTS (
    SELECT 1 
    FROM jsonb_array_elements(content->'elements') AS element
    WHERE NOT (element ? 'hidden')
  );