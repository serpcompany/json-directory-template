CREATE TABLE IF NOT EXISTS public_listings (
  site_id TEXT NOT NULL,
  slug TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  website TEXT NOT NULL,
  category TEXT NOT NULL,
  categories_json TEXT NOT NULL,
  published_at TEXT NOT NULL,
  featured INTEGER NOT NULL DEFAULT 0,
  is_unofficial INTEGER NOT NULL DEFAULT 0,
  priority TEXT,
  entity_type TEXT,
  media_json TEXT,
  resource_links_json TEXT,
  content TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'approved', 'rejected')),
  source_updated_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (site_id, slug)
);

CREATE INDEX IF NOT EXISTS public_listings_site_status_published_at_idx
  ON public_listings (site_id, status, published_at DESC);

CREATE INDEX IF NOT EXISTS public_listings_site_category_status_idx
  ON public_listings (site_id, category, status);

CREATE TABLE IF NOT EXISTS public_listing_import_runs (
  id TEXT PRIMARY KEY,
  site_id TEXT NOT NULL,
  source_kind TEXT NOT NULL,
  source_path TEXT NOT NULL,
  record_count INTEGER NOT NULL,
  checksum TEXT,
  dry_run INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
