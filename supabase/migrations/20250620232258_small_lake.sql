/*
  # Update story pages to support dual-layout structure

  1. Schema Changes
    - Update existing story pages to use dual-layout structure (landscape/portrait)
    - Add zIndex and hidden properties to all elements
    - Ensure backward compatibility with existing data

  2. Data Migration
    - Convert flat element arrays to dual-layout structure
    - Add missing zIndex and hidden properties to elements
    - Preserve existing element data and properties
*/

-- First, update pages that have the old flat structure to use dual-layout structure
UPDATE story_pages 
SET content = jsonb_build_object(
  'landscape', jsonb_build_object(
    'elements', COALESCE(content->'elements', '[]'::jsonb),
    'background', content->'background',
    'animation', content->'animation'
  ),
  'portrait', jsonb_build_object(
    'elements', '[]'::jsonb,
    'background', null,
    'animation', null
  )
)
WHERE content ? 'elements' 
  AND NOT (content ? 'landscape' AND content ? 'portrait');

-- Function to add zIndex and hidden properties to elements array
CREATE OR REPLACE FUNCTION add_element_properties(elements_array jsonb)
RETURNS jsonb AS $$
DECLARE
  element jsonb;
  result jsonb := '[]'::jsonb;
  index_counter int := 0;
BEGIN
  FOR element IN SELECT * FROM jsonb_array_elements(elements_array)
  LOOP
    result := result || jsonb_build_array(
      element || jsonb_build_object(
        'zIndex', COALESCE((element->>'zIndex')::int, index_counter),
        'hidden', COALESCE((element->>'hidden')::boolean, false)
      )
    );
    index_counter := index_counter + 1;
  END LOOP;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Update landscape elements to have zIndex and hidden properties
UPDATE story_pages 
SET content = jsonb_set(
  content,
  '{landscape,elements}',
  add_element_properties(content->'landscape'->'elements')
)
WHERE content->'landscape' ? 'elements' 
  AND jsonb_array_length(content->'landscape'->'elements') > 0;

-- Update portrait elements to have zIndex and hidden properties
UPDATE story_pages 
SET content = jsonb_set(
  content,
  '{portrait,elements}',
  add_element_properties(content->'portrait'->'elements')
)
WHERE content->'portrait' ? 'elements' 
  AND jsonb_array_length(content->'portrait'->'elements') > 0;

-- Clean up the temporary function
DROP FUNCTION add_element_properties(jsonb);

-- Ensure all pages have the dual-layout structure even if they were empty
UPDATE story_pages 
SET content = jsonb_build_object(
  'landscape', jsonb_build_object(
    'elements', '[]'::jsonb,
    'background', null,
    'animation', null
  ),
  'portrait', jsonb_build_object(
    'elements', '[]'::jsonb,
    'background', null,
    'animation', null
  )
)
WHERE content IS NULL OR content = '{}'::jsonb;