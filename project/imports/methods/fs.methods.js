const lib = {
  fs: require('fs'),
  path: require('path')
}

import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

import { fromFStoDB } from '../fs/sync.js';
import { sharedFolder } from '../fs/sync.js';
import { FilesTree } from '../api/FilesTree.js';

Meteor.methods({
  uploadCallback() {
    fromFStoDB();
  },

  mv(keyNodeFrom, keyNodeTo) {
    check(keyNodeTo, String);
    check(keyNodeFrom, String);

    const nodeFrom = FilesTree.findOne({_id: keyNodeFrom});
    const nodeTo = FilesTree.findOne({_id: keyNodeTo});

    if (!nodeTo.folder) {
      throw new Meteor.Error(`The "${nodeTo.title}" should be a folder`);
    }

    let exists = FilesTree.findOne({
      parent: nodeTo._id,
      title: nodeFrom.title,
      folder: nodeFrom.folder
    });

    if (exists) {
      throw new Meteor.Error(
        `The file "${exists.path}" exists. ` +
        `Rename file first before moving.`
      );
    }

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

    nodeFrom.parent = nodeTo._id;
    const oldPath = nodeFrom.path;
    nodeFrom.path = lib.path.join(nodeTo.path, nodeFrom.title);

    // updating DB index
    FilesTree.update({_id: nodeFrom._id}, nodeFrom);

    // moving in File Syste
    lib.fs.renameSync(
      lib.path.join(sharedFolder, oldPath),
      lib.path.join(sharedFolder, nodeFrom.path)
    );
  }
});
