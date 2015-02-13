var assert = require('assert');
var mongoose = require('mongoose');
var sinon = require('sinon');
var hybrid = require('../lib/hybrid');

describe('Hybrid', function() {
    var model, Test;

    before(function() {
        var schema = new mongoose.Schema({
            roles: [String]
        });

        schema.plugin(hybrid, {
            public: '*',

            additionalKeys: function() {
                return this.roles.map(function(role) {
                    return 'role:' + role;
                });
            }
        });

        Test = mongoose.model('Hybrid', schema);
    });

    beforeEach(function() {
        model = new Test({
            roles: ['foo', 'bar']
        });
    });

    it('returns access keys', function() {
        var keys = model.getAccessKeys();
        assert.deepEqual(keys, ['subject:' + model._id, '*', 'role:foo', 'role:bar']);
    });

    describe('when getting access for entity', function() {
        var entity;

        beforeEach(function() {
            var access = {
                '*': ['a', 'b'],
                'role:foo': ['a'],
                'role:bar': ['c']
            };

            entity = {
                getAccess: function(key) {
                    return access[key] || [];
                }
            };
        });

        it('combines all permissions', function() {
            var perms = model.getSubjectAccess(entity);
            assert.deepEqual(perms, ['a', 'b', 'c']);
        });
    });

    describe('when setting access for an entity', function() {
        var entity, setAccess;

        beforeEach(function() {
            entity = {
                setAccess: function() {}
            };
            setAccess = sinon.spy(entity, 'setAccess');
        });

        it('sets permissions for subject key', function() {
            model.setSubjectAccess(entity, ['a']);
            assert.ok(setAccess.calledOnce);

            var key = setAccess.getCall(0).args[0];
            var perms = setAccess.getCall(0).args[1];

            assert.equal(key, 'subject:' + model._id);
            assert.deepEqual(perms, ['a']);
        });
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
                $or: [{
                    '_acl.foo': {
                        $all: ['baz', 'qux']
                    }
                }, {
                    '_acl.bar': {
                        $all: ['baz', 'qux']
                    }
                }]
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
