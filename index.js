let fs = require('fs');
let jsf = require('json-schema-faker');
let yaml = require('js-yaml');
let path = require('path');
let deref = require('json-schema-deref-sync');

const outDir = 'data';


// add custom generator for integer timestamp
jsf.extend('faker', function(faker) {
    faker.locale = 'de'; // or any other language
    let ids = {};
    let locations = {};
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
    chunk: [
        chunk => {
            chunk.direction = ['erase', 'encrypt', 'upload'].indexOf(chunk.operationType) != -1 ? 'save' : 'open';
        }
    ]
}

let api = yaml.safeLoad(fs.readFileSync('./api.yaml'));
api = deref(api);

let dtosToGenerate = {
    customer: 10,
    provider: 5,
    file: 1000,
    chunk: 10000,
    sharing: 1000,
    operation: 100000,
};

function buildId(i) {
	return {
		index: {
			'_id': i
		}
	};
}

for (let dto in dtosToGenerate) {
    console.time(dto);
    let n = dtosToGenerate[dto];
    let schema = {
	    type: 'array',
        items: api.definitions[dto],
        minItems: n,
        maxItems: n,
    };
    let fake = jsf(schema);

    if (postProcessing[dto]) postProcessing[dto].forEach(func => fake.forEach(item => func(item)));

    let i = 0;
    let file = fs.openSync(path.join(outDir, dto), 'w');
    for (let item of fake) {
        fs.writeSync(file, JSON.stringify(buildId(i++)) + '\n');
        fs.writeSync(file, JSON.stringify(item) + '\n');
    }
    console.timeEnd(dto);
}




