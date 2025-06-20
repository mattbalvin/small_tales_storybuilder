/*
  # Add Z-index and visibility properties to story elements

  1. Database Changes
    - Add zIndex and hidden properties to all existing elements in story pages
    - Ensure proper z-index ordering for existing elements
    - Maintain backward compatibility

  2. Data Migration
    - Updates existing story pages to include zIndex and hidden properties
    - Assigns z-index values based on element order
    - Sets default hidden value to false
*/

-- First, add zIndex and hidden properties to elements that don't have them
DO $$
DECLARE
    page_record RECORD;
    elements_array jsonb;
    element_record jsonb;
    updated_elements jsonb := '[]'::jsonb;
    element_index integer;
BEGIN
    -- Loop through all story pages that have elements
    FOR page_record IN 
        SELECT id, content 
        FROM story_pages 
        WHERE content ? 'elements' 
          AND jsonb_array_length(content->'elements') > 0
    LOOP
        elements_array := page_record.content->'elements';
        updated_elements := '[]'::jsonb;
        element_index := 0;
        
        -- Loop through each element in the page
        FOR element_record IN 
            SELECT value 
            FROM jsonb_array_elements(elements_array)
        LOOP
            -- Add zIndex if it doesn't exist, otherwise keep existing value
            IF element_record ? 'zIndex' THEN
                element_record := element_record || jsonb_build_object(
                    'hidden', COALESCE((element_record->>'hidden')::boolean, false)
                );
            ELSE
                element_record := element_record || jsonb_build_object(
                    'zIndex', element_index,
                    'hidden', COALESCE((element_record->>'hidden')::boolean, false)
                );
            END IF;
            
            -- Add the updated element to the array
            updated_elements := updated_elements || jsonb_build_array(element_record);
            element_index := element_index + 1;
        END LOOP;
        
        -- Update the page with the new elements array
        UPDATE story_pages 
        SET content = jsonb_set(content, '{elements}', updated_elements)
        WHERE id = page_record.id;
    END LOOP;
END $$;

-- Ensure all elements have sequential zIndex values starting from 0
-- This handles cases where elements might have been added with gaps in zIndex
DO $$
DECLARE
    page_record RECORD;
    elements_array jsonb;
    element_record jsonb;
    updated_elements jsonb := '[]'::jsonb;
    element_index integer;
BEGIN
    -- Loop through all story pages that have elements
    FOR page_record IN 
        SELECT id, content 
        FROM story_pages 
        WHERE content ? 'elements' 
          AND jsonb_array_length(content->'elements') > 0
    LOOP
        elements_array := page_record.content->'elements';
        updated_elements := '[]'::jsonb;
        element_index := 0;
        
        -- Sort elements by their current zIndex (or by array position if no zIndex)
        FOR element_record IN 
            SELECT value 
            FROM jsonb_array_elements(elements_array)
            ORDER BY COALESCE((value->>'zIndex')::integer, 999999)
        LOOP
            -- Update zIndex to be sequential starting from 0
            element_record := jsonb_set(element_record, '{zIndex}', to_jsonb(element_index));
            
            -- Add the updated element to the array
            updated_elements := updated_elements || jsonb_build_array(element_record);
            element_index := element_index + 1;
        END LOOP;
        
        -- Update the page with the reordered elements array
        UPDATE story_pages 
        SET content = jsonb_set(content, '{elements}', updated_elements)
        WHERE id = page_record.id;
    END LOOP;
END $$;