module.exports = function(schema, options) {
    options || (options = {});

    if (!options.key) {
        options.key = function() {
            return 'subject:' + this._id;
        };
    }

    if (!options.allow) {
        options.allow = function() {
            return [];
        };
    }

    // Methods

    schema.methods.getAccessKeys = function() {
        var key = options.key.call(this);
        var allow = options.allow.call(this);
        var keys = [key, options.public].concat(allow);

        return keys.filter(function(key) {
            return !!key;
        });
    };

    schema.methods.getAccess = function(entity) {
        var perms = this.getAccessKeys().map(function(key) {
            return entity.getAccess(key);
        });

        var result = {};

        perms.forEach(function(ops) {
            for (var op in ops) {
                result[op] = result[op] || ops[op];
            }
        });

        return result;
    };

    schema.methods.setAccess = function(entity, perms) {
        var key = options.key.call(this);
        entity.setAccess(key, perms);
    };
};