const lib = {
  fs: require('fs'),
  path: require('path')
}

import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

import { sharedFolder } from '../fs/sync.js';
import { relativePathOf } from '../fs/sync.js';
import { TempFile } from '../api/TempFile.js';

Meteor.methods({

  /**
   * Update
   */
  tempUpdate(nodeKey, filePath) {
    check(nodeKey, String);
    check(filePath, String);

    console.log(nodeKey, filePath);
  }
});
