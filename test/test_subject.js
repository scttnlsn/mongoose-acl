var assert = require('assert');
var mongoose = require('mongoose');
var sinon = require('sinon');
var subject = require('../lib/subject');

describe('Subject', function() {
    var model, Test;

    beforeEach(function() {
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
                '*': {
                    a: true,
                    b: true,
                    c: false
                },
                'role:foo': {
                    a: true,
                    b: false,
                    c: false
                },
                'role:bar': {
                    d: false
                }
            };

            entity = {
                getAccess: function(key) {
                    return access[key] || {};
                }
            };
        });

        it('logically ors permissions', function() {
            var perms = model.getAccess(entity);
            assert.deepEqual(perms, { a: true, b: true, c: false, d: false });
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
            model.setAccess(entity, { a: true });
            assert.ok(setAccess.calledOnce);

            var key = setAccess.getCall(0).args[0];
            var perms = setAccess.getCall(0).args[1];

            assert.equal(key, 'subject:' + model._id);
            assert.deepEqual(perms, { a: true });
        });
    });
});