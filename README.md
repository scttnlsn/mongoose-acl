mongoose-acl
===

Usage
---

    var mongoose = require('mongoose');
    var acl = require('mongoose-acl');
    
    var WidgetSchema = new mongoose.Schema({ … });
    WidgetSchema.plugin(acl.object);
    
    var UserSchema = new mongoose.Schema({ … });
    UserSchema.plugin(acl.subject);
    
Methods
---
The plugin adds accessor methods to the object for getting and setting permissions of a particular key:

    var widget = new Widget({ … });
    
    widget.setAccess('foo', { a: true, b: true });
    widget.getAccess('foo'); // => { a: true, b: true }
    
There are also convenience methods added to the subject for getting and setting the permissions for a given object:

    var user = …;
    
    user.setAccess(widget, { read: true, write: true, delete: true });
    user.getAccess(widget); // => { read: true: write: true, delete: true });
    
We can query for all objects to which a particular subject has access:

    Widget.withAccess(user, 'read').exec(function(err, widgets) {
        ...
    });
    
Options
---

### Object

We can specify the path in which the ACL will be stored (by default it will be available at `_acl`):

    WidgetSchema.plugin(acl.object, {
        path: '_acl'
    });
    
### Subject

Each subject is referred to in an ACL by a unique key (by default it is of the form `subject:<subject _id>`).  This can be customized by specifying a `key` option:

    UserSchema.plugin(acl.subject, {
        key: function() {
            return 'user:' + this._id;
        }
    });
    
We can also specify additional ACL keys to which a subject has access.  For example, suppose a user optionally belongs to a number of roles:

    UserSchema.plugin(acl.subject, {
        allow: function() {
            return this.roles.map(function(role) {
                return 'role:' + role;
            });
        }
    });
    
There is one special key referred to as the public key.  If set, the associated permissions will apply to all subjects:

    UserSchema.plugin(acl.subject, {
        public: '*'
    });
    
Tests
---

    npm test