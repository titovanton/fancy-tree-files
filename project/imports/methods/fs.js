const fs = require('fs');

import { Meteor } from 'meteor/meteor';

import { fromFStoDB } from '../fs/sync.js';

Meteor.methods({
  uploadCallback() {
    fromFStoDB();
  }
});
