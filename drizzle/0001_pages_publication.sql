INSERT OR IGNORE INTO site_content (id,body,version,updated_at,updated_by) SELECT 'pages-publication',body,version,updated_at,updated_by FROM site_content WHERE id='main';
