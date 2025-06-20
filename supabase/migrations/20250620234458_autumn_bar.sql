/*
  # Convert story pages to new dual-layout structure with shared content

  1. Data Structure Changes
    - Convert from dual-layout structure (landscape/portrait) to shared content structure
    - Elements now have shared properties and separate layout properties per orientation
    - Each element has content properties (text, image src, etc.) that are shared
    - Each element has layout properties (position, size, z-index, visibility) per orientation

  2. Migration Steps
    - Convert existing dual-layout pages to new shared content structure
    - Preserve all existing element data
    - Ensure proper default values for missing properties
    - Handle both old flat structure and current dual-layout structure

  3. New Structure
    - content.elements[] - array of elements with shared properties and per-orientation layouts
    - Each element has properties (shared content) and layouts.landscape/portrait (positioning)
*/

-- Function to convert dual-layout structure to shared content structure
CREATE OR REPLACE FUNCTION convert_to_shared_content_structure(page_content jsonb)
RETURNS jsonb AS $$
DECLARE
  landscape_elements jsonb;
  portrait_elements jsonb;
  merged_elements jsonb := '[]'::jsonb;
  element jsonb;
  element_id text;
  landscape_element jsonb;
  portrait_element jsonb;
  merged_element jsonb;
  element_ids text[];
  unique_ids text[];
BEGIN
  -- Handle pages that already have the new structure
  IF page_content ? 'elements' AND NOT (page_content ? 'landscape' AND page_content ? 'portrait') THEN
    RETURN page_content;
  END IF;

  -- Handle old flat structure (convert to dual-layout first, then to shared content)
  IF page_content ? 'elements' AND NOT (page_content ? 'landscape' AND page_content ? 'portrait') THEN
    landscape_elements := COALESCE(page_content->'elements', '[]'::jsonb);
    portrait_elements := '[]'::jsonb;
  ELSE
    -- Extract elements from dual-layout structure
    landscape_elements := COALESCE(page_content->'landscape'->'elements', '[]'::jsonb);
    portrait_elements := COALESCE(page_content->'portrait'->'elements', '[]'::jsonb);
  END IF;

  -- Get all unique element IDs from both orientations
  SELECT array_agg(DISTINCT elem->>'id') INTO element_ids
  FROM (
    SELECT jsonb_array_elements(landscape_elements) as elem
    UNION ALL
    SELECT jsonb_array_elements(portrait_elements) as elem
  ) combined
  WHERE elem->>'id' IS NOT NULL;

  -- Remove duplicates and nulls
  SELECT array_agg(DISTINCT id) INTO unique_ids
  FROM unnest(element_ids) as id
  WHERE id IS NOT NULL;

  -- Process each unique element ID
  FOR element_id IN SELECT unnest(unique_ids)
  LOOP
    -- Find element in landscape
    SELECT elem INTO landscape_element
    FROM jsonb_array_elements(landscape_elements) as elem
    WHERE elem->>'id' = element_id
    LIMIT 1;

    -- Find element in portrait
    SELECT elem INTO portrait_element
    FROM jsonb_array_elements(portrait_elements) as elem
    WHERE elem->>'id' = element_id
    LIMIT 1;

    -- Use landscape element as base, or portrait if landscape doesn't exist
    IF landscape_element IS NOT NULL THEN
      merged_element := landscape_element;
    ELSE
      merged_element := portrait_element;
    END IF;

    -- Create the new structure with shared properties and separate layouts
    merged_element := jsonb_build_object(
      'id', element_id,
      'type', merged_element->>'type',
      'properties', COALESCE(merged_element->'properties', '{}'::jsonb),
      'animation', merged_element->'animation',
      'layouts', jsonb_build_object(
        'landscape', CASE 
          WHEN landscape_element IS NOT NULL THEN
            jsonb_build_object(
              'x', COALESCE((landscape_element->>'x')::int, 50),
              'y', COALESCE((landscape_element->>'y')::int, 50),
              'width', COALESCE((landscape_element->>'width')::int, 200),
              'height', COALESCE((landscape_element->>'height')::int, 100),
              'zIndex', COALESCE((landscape_element->>'zIndex')::int, 0),
              'hidden', COALESCE((landscape_element->>'hidden')::boolean, false)
            )
          ELSE
            jsonb_build_object(
              'x', 50,
              'y', 50,
              'width', 200,
              'height', 100,
              'zIndex', 0,
              'hidden', true
            )
        END,
        'portrait', CASE 
          WHEN portrait_element IS NOT NULL THEN
            jsonb_build_object(
              'x', COALESCE((portrait_element->>'x')::int, 30),
              'y', COALESCE((portrait_element->>'y')::int, 80),
              'width', COALESCE((portrait_element->>'width')::int, 150),
              'height', COALESCE((portrait_element->>'height')::int, 120),
              'zIndex', COALESCE((portrait_element->>'zIndex')::int, 0),
              'hidden', COALESCE((portrait_element->>'hidden')::boolean, false)
            )
          ELSE
            jsonb_build_object(
              'x', 30,
              'y', 80,
              'width', 150,
              'height', 120,
              'zIndex', 0,
              'hidden', true
            )
        END
      )
    );

    -- Add to merged elements array
    merged_elements := merged_elements || jsonb_build_array(merged_element);
  END LOOP;

  -- Return new structure
  RETURN jsonb_build_object(
    'elements', merged_elements,
    'background', COALESCE(page_content->'landscape'->'background', page_content->'background'),
    'animation', COALESCE(page_content->'landscape'->'animation', page_content->'animation')
  );
END;
$$ LANGUAGE plpgsql;

-- Convert all existing pages to the new shared content structure
UPDATE story_pages 
SET content = convert_to_shared_content_structure(content)
WHERE content IS NOT NULL;

-- Ensure all pages have the proper structure even if they were empty
UPDATE story_pages 
SET content = jsonb_build_object(
  'elements', '[]'::jsonb,
  'background', null,
  'animation', null
)
WHERE content IS NULL OR content = '{}'::jsonb;

-- Clean up the temporary function
DROP FUNCTION convert_to_shared_content_structure(jsonb);