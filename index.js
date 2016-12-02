let fs = require('fs');
let jsf = require('json-schema-faker');
let yaml = require('js-yaml');
let deref = require('json-schema-deref-sync');
let path = require('path');

const outDir = 'data';


// add custom generator for integer timestamp
jsf.extend('faker', function(faker) {
    faker.locale = 'de'; // or any other language
    let ids = {};
    function getNewId(type) {
        let currentId = ids[type] === undefined ? -1 : ids[type];
        ids[type] = ++currentId;
        return currentId;
    }
    function getExistingId(type) {
        return faker.random.number({min: 0, max: ids[type]});
    }
    faker.custom = {
        unixTimestamp: function(years, refDate) {
            return Math.floor(faker.date.past(years, refDate).getTime() / 1000);
        },
        id: function(options) {
            let type = options.type;
            let reference = options.reference || false;
            return reference ? getExistingId(type) : getNewId(type);
        }
  };
  return faker;
});

let api = yaml.safeLoad(fs.readFileSync('./api.yaml'));
api = deref(api);

let dtosToGenerate = {
    CustomerDto: 10,
    ProviderDto: 5,
    FileDto: 1000,
    Chunk: 10000,
    SharingDto: 1000,
};

function buildId(i) {
	return {
		index: {
			'_id': i
		}
	};
}

for (let dto in dtosToGenerate) {
    let n = dtosToGenerate[dto];
    let schema = {
	    type: 'array',
	    uniqueItems: true,
        items: api.definitions[dto],
        minItems: n,
        maxItems: n,
    };
    let fake = jsf(schema);

    let i = 0;
    let file = fs.openSync(path.join(outDir, dto), 'w');
    for (let item of fake) {
        fs.writeSync(file, JSON.stringify(buildId(i++)) + '\n');
        fs.writeSync(file, JSON.stringify(item) + '\n');
    }
}




