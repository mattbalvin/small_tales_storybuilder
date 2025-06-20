-- Migration to convert existing single-layout pages to dual-layout structure
-- This migration preserves existing content by copying it to both orientations

DO $$
DECLARE
    page_record RECORD;
    existing_content jsonb;
    new_content jsonb;
BEGIN
    -- Loop through all story pages
    FOR page_record IN 
        SELECT id, content 
        FROM story_pages 
        WHERE content IS NOT NULL
    LOOP
        existing_content := page_record.content;
        
        -- Check if this page already has the new dual-layout structure
        IF existing_content ? 'landscape' AND existing_content ? 'portrait' THEN
            -- Already migrated, skip
            CONTINUE;
        END IF;
        
        -- Create new dual-layout structure
        -- If the page has elements directly, move them to landscape layout
        IF existing_content ? 'elements' THEN
            new_content := jsonb_build_object(
                'landscape', existing_content,
                'portrait', jsonb_build_object(
                    'elements', '[]'::jsonb,
                    'background', existing_content->'background',
                    'animation', existing_content->'animation'
                )
            );
        ELSE
            -- Create empty layouts if no existing content
            new_content := jsonb_build_object(
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
            );
        END IF;
        
        -- Update the page with the new dual-layout structure
        UPDATE story_pages 
        SET content = new_content
        WHERE id = page_record.id;
        
        RAISE NOTICE 'Migrated page % to dual-layout structure', page_record.id;
    END LOOP;
END $$;

-- Ensure all elements in the migrated layouts have required properties
DO $$
DECLARE
    page_record RECORD;
    layout_key text;
    elements_array jsonb;
    element_record jsonb;
    updated_elements jsonb;
    element_index integer;
BEGIN
    -- Loop through all story pages with the new dual-layout structure
    FOR page_record IN 
        SELECT id, content 
        FROM story_pages 
        WHERE content ? 'landscape' OR content ? 'portrait'
    LOOP
        -- Process both landscape and portrait layouts
        FOR layout_key IN SELECT unnest(ARRAY['landscape', 'portrait'])
        LOOP
            -- Skip if this layout doesn't exist
            IF NOT (page_record.content ? layout_key) THEN
                CONTINUE;
            END IF;
            
            -- Skip if this layout has no elements
            IF NOT (page_record.content->layout_key ? 'elements') THEN
                CONTINUE;
            END IF;
            
            elements_array := page_record.content->layout_key->'elements';
            
            -- Skip if elements array is empty
            IF jsonb_array_length(elements_array) = 0 THEN
                CONTINUE;
            END IF;
            
            updated_elements := '[]'::jsonb;
            element_index := 0;
            
            -- Loop through each element in this layout
            FOR element_record IN 
                SELECT value 
                FROM jsonb_array_elements(elements_array)
            LOOP
                -- Ensure element has all required properties
                IF NOT (element_record ? 'zIndex') THEN
                    element_record := element_record || jsonb_build_object('zIndex', element_index);
                END IF;
                
                IF NOT (element_record ? 'hidden') THEN
                    element_record := element_record || jsonb_build_object('hidden', false);
                END IF;
                
                -- Add the updated element to the array
                updated_elements := updated_elements || jsonb_build_array(element_record);
                element_index := element_index + 1;
            END LOOP;
            
            -- Update the page with the updated elements for this layout
            UPDATE story_pages 
            SET content = jsonb_set(
                content, 
                ARRAY[layout_key, 'elements'], 
                updated_elements
            )
            WHERE id = page_record.id;
        END LOOP;
        
        RAISE NOTICE 'Updated element properties for page %', page_record.id;
    END LOOP;
END $$;

-- Create an index on the new dual-layout content structure for better performance
CREATE INDEX IF NOT EXISTS idx_story_pages_dual_layout_content 
ON story_pages USING gin ((content->'landscape'), (content->'portrait'));

-- Add a comment to document the new structure
COMMENT ON COLUMN story_pages.content IS 'Dual-layout content structure with separate landscape and portrait layouts, each containing elements, background, and animation properties';