/*
  # Add zIndex and hidden properties to story page elements

  1. Changes
    - Add zIndex property to all existing elements (0-based indexing)
    - Add hidden property to all existing elements (default false)
    - Ensure proper ordering for elements without zIndex

  2. Notes
    - Uses WITH clause to avoid window function in aggregate
    - Maintains element order while adding missing properties
*/

-- Update existing story pages to add zIndex and hidden properties to elements
WITH updated_elements AS (
  SELECT 
    sp.id,
    jsonb_agg(
      element || 
      jsonb_build_object(
        'zIndex', COALESCE((element->>'zIndex')::int, (ord - 1)),
        'hidden', COALESCE((element->>'hidden')::boolean, false)
      ) 
      ORDER BY ord
    ) AS new_elements
  FROM story_pages sp,
       jsonb_array_elements(sp.content->'elements') WITH ORDINALITY AS t(element, ord)
  WHERE sp.content ? 'elements' 
    AND jsonb_array_length(sp.content->'elements') > 0
  GROUP BY sp.id
)
UPDATE story_pages 
SET content = jsonb_set(content, '{elements}', ue.new_elements)
FROM updated_elements ue
WHERE story_pages.id = ue.id;

-- Ensure all elements have proper sequential zIndex values for any remaining NULL cases
WITH sequential_elements AS (
  SELECT 
    sp.id,
    jsonb_agg(
      element || jsonb_build_object('zIndex', (ord - 1))
      ORDER BY ord
    ) AS new_elements
  FROM story_pages sp,
       jsonb_array_elements(sp.content->'elements') WITH ORDINALITY AS t(element, ord)
  WHERE sp.content ? 'elements' 
    AND jsonb_array_length(sp.content->'elements') > 0
    AND EXISTS (
      SELECT 1 
      FROM jsonb_array_elements(sp.content->'elements') AS elem
      WHERE elem->>'zIndex' IS NULL
    )
  GROUP BY sp.id
)
UPDATE story_pages 
SET content = jsonb_set(content, '{elements}', se.new_elements)
FROM sequential_elements se
WHERE story_pages.id = se.id;