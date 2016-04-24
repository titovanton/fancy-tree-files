const fs = require('fs');

import { Meteor } from 'meteor/meteor';
// import { EJSON } from 'meteor/ejson'

Meteor.methods({
  readdir() {
    const lsResult = fs.readdirSync('/vagrant/folder');
    return lsResult;
    // return EJSON.stringify(lsResult);
  }
});
