/*
  # Add zIndex support to story page elements

  1. Database Changes
    - Update story_pages content structure to support zIndex and hidden properties
    - Add migration to update existing elements with default zIndex values
  
  2. Data Migration
    - Add zIndex property to all existing elements
    - Add hidden property to all existing elements
    - Ensure proper z-index ordering for existing content
*/

-- Update existing story pages to add zIndex and hidden properties to elements
UPDATE story_pages 
SET content = jsonb_set(
  content,
  '{elements}',
  (
    SELECT jsonb_agg(
      element || 
      jsonb_build_object(
        'zIndex', COALESCE((element->>'zIndex')::int, row_number() OVER () - 1),
        'hidden', COALESCE((element->>'hidden')::boolean, false)
      )
    )
    FROM jsonb_array_elements(content->'elements') WITH ORDINALITY AS t(element, ord)
  )
)
WHERE content ? 'elements' 
  AND jsonb_array_length(content->'elements') > 0;

-- Ensure all elements have proper zIndex values (0-based indexing)
UPDATE story_pages 
SET content = jsonb_set(
  content,
  '{elements}',
  (
    SELECT jsonb_agg(
      element || jsonb_build_object('zIndex', (row_number() OVER ()) - 1)
    )
    FROM jsonb_array_elements(content->'elements') AS element
  )
)
WHERE content ? 'elements' 
  AND jsonb_array_length(content->'elements') > 0
  AND EXISTS (
    SELECT 1 
    FROM jsonb_array_elements(content->'elements') AS element
    WHERE element->>'zIndex' IS NULL
  );