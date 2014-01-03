var Lazy = require("lazy.js");

var proxyArrayPlaceholder = [];
var proxyObjectPlaceholder = {};
var proxyStringPlaceholder = "_proxy";

function extract(obj, keys, alternative){

    // for empty or undefined paths, just assume root
    if (!keys) {
        return obj;
    }

    var parts = keys.split("."), o = obj;

    for (var i=0; i < parts.length; i++) {
        var part = parts[i];

        if (typeof o !== "object") {
            // this is the last key, so we've found the value
            return alternative;
        }

        o = o[part];
    }

    if (typeof o === "undefined") {
        return alternative;
    }

    return o;
}

module.exports = {
    init: function(Schema){

        Schema.ProxyArray = function(proxyPath){
            var lazy = Lazy(proxyArrayPlaceholder);
            lazy.proxyPath = proxyPath || "";
            return lazy;
        };

        Schema.ProxyObject = function(){
            var lazy = Lazy(proxyObjectPlaceholder);
            lazy.proxyPath = proxyPath || "";
            return lazy;
        };

        Schema.ProxyString = function(){
            var lazy = Lazy(proxyStringPlaceholder);
            lazy.proxyPath = proxyPath || "";
            return lazy;
        };

        Schema._extract = extract;

        Schema.resolveProxy = function(proxy, data){
            // find the top level piece
            var root = proxy.parent;
            while (root.parent && !"proxyPath" in root) {
                root = root.parent;
            }

            return proxy.of(extract(data, root.proxyPath || ""))
        };


        /**
         * Make a bound constructor
         *
         * Schema.construct(Foo)(a, b, c) -> new Foo(a, b, c)
         *
         * @param {Function} constructor Returns a function which can be used like a constructor with
         *                     and implied `new`
         * @returns {Function} a function with the same arguments as the constructor passed
         */
        Schema.construct = function (constructor) {
            // the reason for the complexity is that `new constructor` wouldn't allow us
            // to apply an unknown number of arguments
            return function () {

                // create a temporary constructor so we don't have own properties
                //
                var tempConstructor = function () {
                };
                for ( var key in constructor.prototype ) {
                    tempConstructor.prototype[key] = constructor.prototype[key];
                }

                // set our constructor on the prototype to avoid an own property
                tempConstructor.prototype.constructor = constructor;

                // create the object
                var obj = new tempConstructor;

                // run the body of the constructor, passing along any arguments we get here
                constructor.apply(obj, arguments);

                return obj;
            };
        };
    }
};

Lazy.Sequence.prototype.setSource = function(source) {
    var parent = this;

    do {
        parent.source = source;
        parent = parent.parent;
    } while (parent);
};

Lazy.Sequence.prototype.of = function(source) {
    var source, returnValue;

    var previousSource = this.parent.source;
    this.setSource(source);

    if (this.startsWith) {
        returnValue = this.toString();
    }
    else if (this.pairs) {
        returnValue = this.toObject();
    }
    else {
        returnValue = this.toArray();
    }

    this.setSource(previousSource);
    return returnValue;
};
