module.exports = function(schema, options) {
    options || (options = {});
    options.path || (options.path = '_acl');

    // Fields

    var fields = {};

    if (!schema.paths[options.path]) {
        fields[options.path] = {};
    }

    schema.add(fields);

    // Methods

    schema.methods.setAccess = function(key, ops) {
        ops || (ops = {});
        this[options.path] || (this[options.path] = {});
        this[options.path][key] = ops;
        this.markModified(options.path);
    };

    schema.methods.getAccess = function(key) {
        var acl = this[options.path] || {};
        return acl[key] || {};
    };

    var toJSON = schema.methods.toJSON;

    schema.methods.toJSON = function() {
        var data = toJSON ? toJSON.call(this) : this.toObject();
        delete data[options.path];
        return data;
    };

    // Statics

    schema.statics.withAccess = function(subject, op, callback) {
        var keys = subject.getAccessKeys();

        var or = keys.map(function(key) {
            var path = [options.path, key, op].join('.');
            var query = {};
            query[path] = true;
            return query;
        });

        var cursor = this.find({ $or: or });

        if (callback) {
            cursor.exec(callback);
        }

        return cursor;
    };
};