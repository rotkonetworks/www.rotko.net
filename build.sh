#!/bin/bash

# build the spa
npm run build

# create sitemap
cat > dist/sitemap.xml << 'SITEMAP'
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://rotko.net/</loc><priority>1.0</priority></url>
  <url><loc>https://rotko.net/services</loc><priority>0.8</priority></url>
  <url><loc>https://rotko.net/infrastructure</loc><priority>0.8</priority></url>
  <url><loc>https://rotko.net/team</loc><priority>0.7</priority></url>
  <url><loc>https://rotko.net/blog</loc><priority>0.9</priority></url>
  <url><loc>https://rotko.net/contact</loc><priority>0.7</priority></url>
</urlset>
SITEMAP

# create robots.txt
cat > dist/robots.txt << 'ROBOTS'
User-agent: *
Allow: /
Sitemap: https://rotko.net/sitemap.xml
ROBOTS

echo "Build complete in dist/"
