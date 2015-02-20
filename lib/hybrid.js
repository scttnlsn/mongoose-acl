var subject = require('./subject');
var object = require('./object');

module.exports = function(schema, options) {
    // save off subject methods that would be overwritten under different name
    subject(schema, options);
    schema.methods.getSubjectAccess = schema.methods.getAccess;
    schema.methods.setSubjectAccess = schema.methods.setAccess;

    // apply object methods
    object(schema, options);
};
