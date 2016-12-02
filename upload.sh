HOST='localhost:9200'
INDEX='dashboard'
BASE="$HOST/$INDEX"

curl -XDELETE "$BASE"
curl -XPUT "$BASE"

LOC_DATA='
{
  "properties" : {
    "location" : {
      "type" : "geo_point"
    }
  }
}
'

cd data
for file in ./*; do
    curl -XPUT "$BASE/_mapping/$file" -d "$LOC_DATA"
	curl -XPOST "localhost:9200/dashboard/$file/_bulk?refresh" --data-binary "@$file" > /dev/null
done
cd ..
