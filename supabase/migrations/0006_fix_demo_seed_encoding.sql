-- =============================================================================
-- Zando V2 — Migration 0006 — Fix Demo Seed Encoding
-- =============================================================================
-- DEVELOPMENT / DEMO DATA CLEANUP.
--
-- The seed was run through the Supabase SQL Editor with a non-UTF-8 connection,
-- which stored the UTF-8 bytes for French accented characters as if they were
-- Latin-1. Result: "Bières" (è = 0xC3 0xA8 in UTF-8) was stored as two
-- separate characters "Ã¨", and "minérale" as "minÃ©rale".
--
-- This migration corrects the affected rows using chr() so that the SQL itself
-- is encoding-safe regardless of how this file is opened or pasted.
--
--   chr(232) = U+00E8 = è
--   chr(233) = U+00E9 = é
--
-- Affected rows:
--   product_categories.name WHERE slug = 'bieres'
--   products.description  WHERE slug IN (beer slugs + 'eau-vive-50cl')
-- =============================================================================

BEGIN;

-- Fix category name: Bières
UPDATE public.product_categories
SET    name = 'Bi' || chr(232) || 'res'
WHERE  slug = 'bieres';

-- Fix beer product descriptions: Bière
UPDATE public.products
SET    description = 'Bi' || chr(232) || 're Nkoyi Blonde 33cl'
WHERE  slug = 'nkoyi-blonde';

UPDATE public.products
SET    description = 'Bi' || chr(232) || 're Nkoyi Black 33cl'
WHERE  slug = 'nkoyi-black';

UPDATE public.products
SET    description = 'Bi' || chr(232) || 're Beaufort 65cl'
WHERE  slug = 'beaufort';

UPDATE public.products
SET    description = 'Bi' || chr(232) || 're Heineken 33cl'
WHERE  slug = 'heineken';

UPDATE public.products
SET    description = 'Bi' || chr(232) || 're Castel 65cl'
WHERE  slug = 'castel';

UPDATE public.products
SET    description = 'Bi' || chr(232) || 're Tembo 65cl'
WHERE  slug = 'tembo';

-- Fix water product description: minérale
UPDATE public.products
SET    description = 'Eau min' || chr(233) || 'rale Eau Vive 50cl'
WHERE  slug = 'eau-vive-50cl';

COMMIT;
