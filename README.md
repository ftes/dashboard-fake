# Usage
1. `yarn install` (or `npm install`)
2. `npm start`

# Upload to Elasticsearch
1. `curl -XDELETE 'localhost:9200/dashboard'`
2. `cd data; for file in .*; do curl -XPOST "localhost:9200/dashboard/$file/_bulk?refresh" --data-binary "@$file" > /dev/null; done`

# Refresh Kibana
If the mappings change, Kibana needs to be refreshed manually (Management, Index Patterns, dashboard, Refresh Button)
