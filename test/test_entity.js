var assert = require('assert');
var mongoose = require('mongoose');
var sinon = require('sinon');
var entity = require('../lib/entity');

describe('Entity', function() {
    var schema, model, Model;

    beforeEach(function() {
        schema = new mongoose.Schema();
        schema.plugin(entity, {
            path: '_acl'
        });

        Model = mongoose.model('test', schema);
        model = new Model();
    });

    it('adds acl field to schema', function() {
        assert.ok(schema.paths['_acl']);
    });

    describe('when setting permissions', function() {
        beforeEach(function() {
            model.setAccess('foo', { bar: true });
        });

        it('sets permissions in acl', function() {
            assert.equal(model._acl.foo.bar, true);
            assert.deepEqual(model.getAccess('foo'), { bar: true });
        });

        it('marks acl as modified', function() {
            assert.ok(model.isModified('_acl'));
        });
    });

    describe('when getting permission cursor', function() {
        var cursor, subject;

        beforeEach(function() {
            subject = {
                getAccessKeys: function() {
                    return ['foo', 'bar'];
                }
            };
        });

        it('creates $or query for all access keys and op', function() {
            var find = sinon.spy(Model, 'find');
            var cursor = Model.withAccess(subject, 'baz');
            
            assert.ok(find.calledOnce);

            var query = find.getCall(0).args[0];

            assert.deepEqual(query, {
                $or: [
                    { '_acl.foo.baz': true },
                    { '_acl.bar.baz': true }
                ]
            });
        });
    });
});