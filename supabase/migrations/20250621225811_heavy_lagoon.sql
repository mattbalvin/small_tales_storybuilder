/*
  # Update story page elements with zIndex and hidden properties

  1. Changes Made
    - Add zIndex property to all elements (0-based indexing based on array position)
    - Add hidden property to all elements (default false)
    - Ensure proper ordering and structure for existing elements

  2. Technical Details
    - Uses CTE (Common Table Expression) to avoid window function issues in aggregates
    - Processes each story page individually
    - Maintains existing element properties while adding new ones
    - Uses array position for zIndex calculation
*/

-- Update existing story pages to add zIndex and hidden properties to elements
WITH updated_elements AS (
  SELECT 
    sp.id,
    jsonb_agg(
      element || 
      jsonb_build_object(
        'zIndex', COALESCE((element->>'zIndex')::int, (ordinality - 1)),
        'hidden', COALESCE((element->>'hidden')::boolean, false)
      )
      ORDER BY ordinality
    ) AS new_elements
  FROM story_pages sp,
       jsonb_array_elements(sp.content->'elements') WITH ORDINALITY AS t(element, ordinality)
  WHERE sp.content ? 'elements' 
    AND jsonb_array_length(sp.content->'elements') > 0
  GROUP BY sp.id
)
UPDATE story_pages 
SET content = jsonb_set(content, '{elements}', ue.new_elements)
FROM updated_elements ue
WHERE story_pages.id = ue.id;

-- Ensure all elements have proper sequential zIndex values (0-based indexing)
-- This handles any remaining elements that might not have zIndex set properly
WITH sequential_elements AS (
  SELECT 
    sp.id,
    jsonb_agg(
      element || jsonb_build_object('zIndex', (ordinality - 1))
      ORDER BY ordinality
    ) AS new_elements
  FROM story_pages sp,
       jsonb_array_elements(sp.content->'elements') WITH ORDINALITY AS t(element, ordinality)
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