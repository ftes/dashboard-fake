source params

curl -XDELETE "$BASE"
curl -XPUT "$BASE"

LOC_DATA='{ "properties" : { "location" : { "type" : "geo_point" } } }'

cd data
for file in ./*; do
    echo "curl -XPUT \"$BASE/_mapping/$file\" -d \"$LOC_DATA\""
    curl -XPUT "$BASE/_mapping/$file" -d "$LOC_DATA"
done
cd ..
