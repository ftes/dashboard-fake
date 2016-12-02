source params

cd data
for file in *; do
    echo "curl -XPOST \"$BASE/$file/_bulk?refresh\" --data-binary \"@$file\" > /dev/null"
	curl -XPOST "$BASE/$file/_bulk?refresh" --data-binary "@$file" > /dev/null
done
cd ..
