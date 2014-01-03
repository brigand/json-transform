// In this file we want to transform our starting JSON into a more usable format
// We have an array of users as it might come out of a database
// There are two teams, and we need to be able to easily distinguish between them
// We would also like to create User objects out of them

var parsedJSON = {
    users: [
        {
            name: "Andrew",
            team: "Alpha"
        },
        {
            name: "Alex",
            team: "Alpha"
        },
        {
            name: "Beth",
            team: "Beta"
        },
        {
            name: "Amy",
            team: "Alpha"
        },
        {
            name: "Bell",
            team: "Beta"
        },
        // for some reason our database had a user with no name or team
        {}
    ]
};

var Schema = require("../src/Schema");
var assert = require("assert");
/*
function User(props){
    this.name = props.name;
    this.team = props.team;
}*/

// Now we define the schema to ensure data integrity
var schema = Schema({
    users:[
        // this declares the schema for each item in the list
        // there may be as many items as our input provides
        {
            name: String,
            team: String
        }
    ]
});

// With this schema in mind, we need to also declare our transformations
var teamTransform = Schema.transform({
    // we create a proxy object
    // this works like underscore.js's chain function
    // with the exception that nothing's actually done right now
    // when we actually go to use this transform, all of the functions
    // will be executed on the real object
    teams: Schema.ProxyArray("users").groupBy("team")
});

// we have one transform, but you could add more as aditional arguments
var data = schema.fix(parsedJSON, teamTransform);

console.log(JSON.stringify(data, null, 4));

assert(typeof data === "object");

// verify we're not killing an original data structure
assert(data.users.length === parsedJSON.users.length);

assert(data.teams.Beta.constructor.name === "Array");
assert(data.teams.Alpha.constructor.name === "Array");

assert(data.teams.Alpha.length === 3);
assert(data.teams.Beta.length === 2);

assert(data.teams.Beta.indexOf(parsedJSON.users[2]) !== -1);

console.log("transform.js completed with no problems");

