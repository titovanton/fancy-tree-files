const lib = {
  fs: require('fs'),
  path: require('path')
}

import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

import { fromFStoDB } from '../fs/sync.js';
import { fromDBtoFS } from '../fs/sync.js';
import { sharedFolder } from '../fs/sync.js';
import { relativePathOf } from '../fs/sync.js';
import { absPathOf } from '../fs/sync.js';
import { FilesTree } from '../api/FilesTree.js';

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

// TODO: needs to be done
const renameExists = () => {

    /** Auto rename a file if the same name exists in a destination folder
     * example: file.txt, file(1).txt, file(2).txt
     */
    // while (exists) {
    //   let filename = exists.title;
    //   let copyNumber = 1;
    //   let ext = '';
    //
    //   // extract extantion
    //   let matches = filename.match(/^(.+)([.][^.]+)$/);
    //
    //   if (matches) {
    //     filename = matches[1];
    //     ext = matches[2];
    //   }
    //
    //   // extract copy number
    //   matches = filename.match(/^(.+)\((\d+)\)$/);
    //
    //   if (matches) {
    //     filename = matches[1];
    //     copyNumber = parseInt(matches[2]) + 1;
    //   }
    //
    //   // copyNumber = parseInt(copyNumber) + 1;
    //   nodeFrom.title = `${filename}(${copyNumber})${ext}`;
    //
    //   exists = FilesTree.findOne({
    //     parent: nodeTo._id,
    //     title: nodeFrom.title,
    //     folder: nodeFrom.folder
    //   });
    // }
}
