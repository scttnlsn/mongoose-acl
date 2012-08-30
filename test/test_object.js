var assert = require('assert');
var mongoose = require('mongoose');
var sinon = require('sinon');
var object = require('../lib/object');

describe('Entity', function() {
    var model, Test;

    beforeEach(function() {
        var schema = new mongoose.Schema();
        schema.plugin(object, {
            path: '_acl'
        });

        Test = mongoose.model('test', schema);
        model = new Test();
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
            var find = sinon.spy(Test, 'find');
            var cursor = Test.withAccess(subject, 'baz');
            
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