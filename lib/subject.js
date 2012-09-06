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
        var entries = this.getAccessKeys().map(function(key) {
            return entity.getAccess(key);
        });

        var result = {};

        entries.forEach(function(perms) {
            for (var perm in perms) {
                result[perm] = result[perm] || perms[perm];
            }
        });

        return result;
    };

    schema.methods.setAccess = function(entity, perms) {
        var key = options.key.call(this);
        entity.setAccess(key, perms);
    };
};