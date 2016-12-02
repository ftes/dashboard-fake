// input: item-count-file [number of elapsed seconds since last invocation]
const itemCountFile = process.argv[2];
const elapsedSeconds = process.argv[3];

let fs = require('fs');
let jsf = require('json-schema-faker');
let yaml = require('js-yaml');
let path = require('path');
let deref = require('json-schema-deref-sync');

const outDir = 'data';
const metadataDir = 'metadata';

function readObject(filePath) {
    if (fs.existsSync(filePath)) return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    return {};
}

let ids = readObject(path.join(metadataDir, 'ids.json'));
let locations = readObject(path.join(metadataDir, 'locations.json'));

// add custom generator for integer timestamp
jsf.extend('faker', function(faker) {
    faker.locale = 'de'; // or any other language
    function getNewId(type) {
        let currentId = ids[type] === undefined ? -1 : ids[type];
        ids[type] = ++currentId;
        return currentId;
    }
    function getExistingId(type) {
        return faker.random.number({min: 0, max: ids[type]});
    }
    function getNewLocation(type) {
        let typeLocs = locations[type] === undefined ? [] : locations[type];
        let newLoc = {
            lat: faker.random.number({min: 48.1351253, max: 53.5510846, precision: 0.00001}),
            lon: faker.random.number({min: 8.4660395, max: 13.4049540, precision: 0.00001}),
        };
        typeLocs.push(newLoc);
        locations[type] = typeLocs;
        return newLoc;
    }
    function getExistingLocation(type) {
        return faker.random.arrayElement(locations[type]);
    }
    faker.custom = {
        past: function(years, refDate) {
            // otherwise converted to string in different format
            return faker.date.past(years, refDate).toJSON();
        },
        id: function(options) {
            let type = options.type;
            let reference = options.reference || false;
            return reference ? getExistingId(type) : getNewId(type);
        },
        location: function(options={}) {
            let reference = options.reference || false;
            let type = options.type || 'default';
            return reference ? getExistingLocation(type) : getNewLocation(type);
        }
  };
  return faker;
});

let postProcessing = {
    operation: [
        op => op.direction = ['erase', 'encrypt', 'upload'].indexOf(op.operationType) != -1 ? 'save' : 'open',
        op => op.error = Math.random() > 0.95 ? 1 : 0,
    ],
}

let api = yaml.safeLoad(fs.readFileSync('./api.yaml'));
api = deref(api);

let itemCount = readObject(itemCountFile);

let continuous = false;
if (elapsedSeconds !== undefined) {
    continuous = true;
}

for (let dto in itemCount) {
    console.time(dto);
    let n = itemCount[dto];
    let schema = {
	    type: 'array',
        items: api.definitions[dto],
        minItems: n,
        maxItems: n,
    };
    let fake = jsf(schema);

    let postFuncs = postProcessing[dto]
    if (postFuncs) postFuncs.forEach(func => fake.forEach(item => func(item)));

    // set timestamps to last x seconds
    if (continuous) {
        let now = new Date().getTime();
        let numSeconds = parseInt(elapsedSeconds);
        for (let item of fake) {
            let randomNumSeconds = Math.random() * (numSeconds + 1);
            item.timestamp = new Date(now - randomNumSeconds * 1000).toJSON();
        }
    }

    let i = 0;
    let file = fs.openSync(path.join(outDir, dto), 'w');
    for (let item of fake) {
        fs.writeSync(file, JSON.stringify({	index: {} }) + '\n');
        fs.writeSync(file, JSON.stringify(item) + '\n');
    }
    console.timeEnd(dto);
}

function writeMetadataObject(fileName, object) {
    fs.writeFileSync(path.join(metadataDir, fileName), JSON.stringify(object));
}
writeMetadataObject('ids.json', ids);
locations.default = undefined;
writeMetadataObject('locations.json', locations);


