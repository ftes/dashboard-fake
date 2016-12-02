./create-index.sh
rm data/*
rm metadata/*
node index.js items-initial.json
./upload-data.sh
