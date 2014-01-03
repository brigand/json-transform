var parsedJSON = {
    a: 1,
    b: 2,
    c: [
        5, 6
    ],
    d: [
        {
            da: 5,
            db: []
        },
        {},
        {},
        {
            db: 100
        }
    ]
};

var Schema = require("../src/Schema");
var assert = require("assert");

var schema = Schema({
    a: Number,
    b: String, // this should cast it to a string
    c: [Number],
    d: [
        {
            da: Number
            // we've intentionally not specified b
            // but that's okay, because Schema won't remove any properties it doesn't
            // recognize
        }
    ],
    // this object is missing from our example input
    // it will be created
    e: {
        ea: Number,
        eb: String,
        ec: [],
        ed: {
            eda: Number
        }
    }
});

var data = schema.fix(parsedJSON);

console.log(JSON.stringify(data, null, 4));

assert(typeof data.a === "number");

assert(typeof data.b === "string");

assert(data.c.constructor.name === "Array");

assert(typeof data.d[0].da === "number");
assert(typeof data.d[0].da === "number");
assert(data.d[0].db.length === 0);

assert(data.e.constructor.name === "Object");
assert(typeof data.e.eb === "string");
assert(data.e.ec.constructor.name === "Array");
assert(data.e.ed.constructor.name === "Object");
assert(data.e.ed.eda === 0);

console.log("simple.js completed with no problems");