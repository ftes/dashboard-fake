let fs = require('fs');
let jsf = require('json-schema-faker');
let yaml = require('js-yaml');
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
        past: function(years, refDate) {
            // otherwise converted to string in different format
            return faker.date.past(years, refDate).toJSON();
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
        items: api[dto],
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
    console.timeEnd(dto);
}




