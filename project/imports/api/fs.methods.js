const lib = {
  fs: require('fs'),
  path: require('path')
}

import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

import { fromFStoDB } from '../api/sync.api.js';
import { fromDBtoFS } from '../api/sync.api.js';
import { sharedFolder } from '../api/sync.api.js';
import { relativePathOf } from '../api/sync.api.js';
import { absPathOf } from '../api/sync.api.js';
import { FilesTree } from '../api/FilesTree.db.js';

Meteor.methods({
  syncFs() {
    fromFStoDB();
    fromDBtoFS();
  },

  mv(keyNodeFrom, keyNodeTo) {
    check(keyNodeTo, String);
    check(keyNodeFrom, String);

    // retrieving
    const nodeFrom = FilesTree.findOne({_id: keyNodeFrom});
    const nodeTo = FilesTree.findOne({_id: keyNodeTo});

    // you can't move to not a folder
    if (!nodeTo.folder) {
      throw new Meteor.Error(`The "${nodeTo.title}" should be a folder`);
    }

    let exists = FilesTree.findOne({
      parent: nodeTo._id,
      title: nodeFrom.title,
      folder: nodeFrom.folder
    });

    // you can't move if the same object with the same name exists in where you
    // moving it
    if (exists) {
      const pathToExists = relativePathOf(exists, FilesTree);

      throw new Meteor.Error(
        `The file "${pathToExists}" exists. ` +
        `Rename file first before moving.`
      );
    }

    const oldPath = absPathOf(nodeFrom, FilesTree);

    // update DB first
    nodeFrom.parent = nodeTo._id;
    FilesTree.update({_id: nodeFrom._id}, nodeFrom);

    const newPath = absPathOf(nodeFrom, FilesTree);

    // moving in File Syste
    lib.fs.renameSync(oldPath, newPath);
  }
});
