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
            model.setAccess('foo', ['bar']);
        });

        it('sets permissions in acl', function() {
            assert.deepEqual(model._acl.foo, ['bar']);
            assert.deepEqual(model.getAccess('foo'), ['bar']);
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

        it('creates $or query for all access keys and perms', function() {
            var find = sinon.spy(Test, 'find');
            var cursor = Test.withAccess(subject, ['baz', 'qux']);
            
            assert.ok(find.calledOnce);

            var query = find.getCall(0).args[0];

            assert.deepEqual(query, {
                $or: [
                    { '_acl.foo': { $all: ['baz', 'qux'] }},
                    { '_acl.bar': { $all: ['baz', 'qux'] }}
                ]
            });
        });
    });

    describe('when getting keys with given permissions', function() {
        beforeEach(function() {
            model.setAccess('foo', ['a', 'b']);
            model.setAccess('bar', ['a']);
            model.setAccess('baz', ['b', 'c']);
        });

        it('returns keys that have all given permissions', function() {
            var keys = model.keysWithAccess(['a']);

            assert.equal(keys.length, 2);
            assert.ok(keys.indexOf('foo') !== -1);
            assert.ok(keys.indexOf('bar') !== -1);

            keys = model.keysWithAccess(['a', 'b']);

            assert.equal(keys.length, 1);
            assert.ok(keys.indexOf('foo') !== -1);

            keys = model.keysWithAccess(['b']);

            assert.equal(keys.length, 2);
            assert.ok(keys.indexOf('foo') !== -1);
            assert.ok(keys.indexOf('baz') !== -1);

            keys = model.keysWithAccess(['c']);

            assert.equal(keys.length, 1);
            assert.ok(keys.indexOf('baz') !== -1);

            keys = model.keysWithAccess(['a', 'c']);

            assert.equal(keys.length, 0);

            keys = model.keysWithAccess(['d']);

            assert.equal(keys.length, 0);
        });
    });
});