-- Make capacity optional (nullable) and remove default value
ALTER TABLE public.events ALTER COLUMN capacity DROP NOT NULL;
ALTER TABLE public.events ALTER COLUMN capacity DROP DEFAULT;
