var assert = require('assert');
var mongoose = require('mongoose');
var sinon = require('sinon');
var subject = require('../lib/subject');

describe('Subject', function() {
    var model, Test;

    before(function() {
        var schema = new mongoose.Schema({
            roles: [String]
        });

        schema.plugin(subject, {
            public: '*',

            additionalKeys: function() {
                return this.roles.map(function(role) {
                    return 'role:' + role;
                });
            }
        });

        Test = mongoose.model('Test', schema);
    });

    beforeEach(function() {
        model = new Test({ roles: ['foo', 'bar'] });
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
            var perms = model.getAccess(entity);
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
            model.setAccess(entity, ['a']);
            assert.ok(setAccess.calledOnce);

            var key = setAccess.getCall(0).args[0];
            var perms = setAccess.getCall(0).args[1];

            assert.equal(key, 'subject:' + model._id);
            assert.deepEqual(perms, ['a']);
        });
    });
});