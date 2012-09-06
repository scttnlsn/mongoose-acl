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

    schema.methods.setAccess = function(key, perms) {
        perms || (perms = {});
        this[options.path] || (this[options.path] = {});
        this[options.path][key] = perms;
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

    schema.statics.withAccess = function(subject, perm, callback) {
        var keys = subject.getAccessKeys();

        var or = keys.map(function(key) {
            var path = [options.path, key, perm].join('.');
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