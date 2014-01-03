var Lazy = require("lazy.js");

var toString = Object.prototype.toString;
var slice = Array.prototype.slice;

// takes an object representing the structure of a JavaScript Object
function Schema(description) {
    // check if they used `new Schema` or not
    if ( this instanceof Schema ) {
        this.d = description;
    } else {
        return new Schema(description);
    }
}

// recursivley enforces the mapping's structure onto the value
function fixValue(value, mapping) {
    // if it's an object, we need to figure out what type and iterate
    // over it, recursivley fixing values as we go
    var valueType = toString.call(value).slice(8, -1);
    var mappingType = toString.call(mapping).slice(8, -1);

    if ( mappingType === "Array" ) {

        // if our value isn't an array, then convert it to an array
        if ( valueType !== "Array" ) {
            // we want an array, but we're getting something else
            if ( typeof value === "object" && value.length ) {
                value = slice.call(value);
            } else if ( value ) {
                value = [value];
            } else {
                value = [];
            }

        }

        // for each item in our value, we want to enforce the mapping's first item
        value = value.map(function (valueItem) {
            return fixValue(valueItem, mapping[0]);
        });
    }

    // it's an object, so fix each key individually
    else if ( mappingType === "Object" ) {
        if ( typeof value === "undefined" ) {
            value = {};
        }

        Object.keys(mapping).forEach(function (key) {
            value[key] = fixValue(value[key], mapping[key]);
        });
    }

    // String, Number, undefined, null, functions
    else {
        if ( typeof value === "undefined" ) {
            value = mapping();
        }

        else if ( mappingType === "Function" ) {
            value = mapping(value);
        }

        // otherwise we don't have a mapping for it, so just return the value
    }


    return value;
}

Schema.transform = function (rootTrans) {
    var rootData;

    var transformValue = function (trans, data, setData) {
        var type = toString.call(trans).slice(8, -1);

        var setDataCallback = function(key){
            return function(value) {
                rootData[key] = value;
            }
        };

        if ( type === "String" ) {
            setData(Schema._extract(rootData, trans));
        }
        // not sure what to do with arrays if they're even allowed
        // I can't see any point in allowing them in the transform step
        /*else if ( type === "Array" ) {
            return trans.map(function(value, key){
                transformValue(value, data[key], key);
            });
        }*/
        else if ( type === "Object" ) {
            if ( trans instanceof Lazy.Sequence ) {
                setData(Schema.resolveProxy(trans, rootData));
            } else {
                return Lazy(trans).each(function (value, key) {
                    data[key] != null || data[key] === {};
                    transformValue(value, data, setDataCallback(key));
                });
            }
        } else if ( type === "Function" ) {
            setData(trans);
        }
    };

    return function (data) {
        rootData = data;
        transformValue({
                _v: rootTrans
            }, {
                _v: rootData
            }, function(){});
    };
};

Schema.prototype.fix = function (data, transform1) {

    var fixed = fixValue(data, this.d);

    var transforms = slice.call(arguments, 1);

    // apply each transform to our data
    if ( transforms.length > 0 ) {
        transforms.forEach(function (transform) {
            transform(fixed);
        });
    }

    return fixed;
};

require("./utils").init(Schema);

module.exports = Schema;
