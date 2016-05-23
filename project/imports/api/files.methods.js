fsLib = require('fs');

import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

import { absPathOf } from './server/lib.js';
import { findDirByPath } from './server/lib.js';
import { fromDBtoFS } from './server/lib.js';
import { fromFStoDB } from './server/lib.js';
import { relativePathOf } from './server/lib.js';
import { sharedFolder } from './server/lib.js';
import { tempFolder } from './server/lib.js';

import { FilesTree } from './files.api.js';
import { TempFile } from './files.api.js';


if (Meteor.isServer) {
  Meteor.methods({
    syncFs() {
      fromFStoDB();
      fromDBtoFS();
    },

    /**
     * Move file using dnd on the client
     */
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
      fsLib.renameSync(oldPath, newPath);
    },

    approveFile(docId) {
      check(docId, String);

      const doc = TempFile.findOne({_id: docId});

      if (!doc) {
        throw new Meteor.Error(
          'assertion error',
          `A document with finding query {_id: '${docId}'} does not exist`,
          'method approveFile'
        );
      }

      const tempPath = pathLib.join(tempFolder, doc.name);
      const tempRelative = pathLib.join('temp', doc.name);
      const newPathDir = pathLib.join(pathLib.dirname(sharedFolder), doc.dirPath);
      let stats = null;

      // checking file in temp folder
      try {
        stats = fsLib.statSync(tempPath);
      } catch(e) {
        // does not exist
        if (e.code == 'ENOENT') {
          throw new Meteor.Error(
            'ENOENT',
            `File [${tempRelative}] does not exist`,
            'method approveFile'
          );
        }
      }

      if (!stats.isFile()) {
        // if it is not a file
        throw new Meteor.Error(
          'assertion error',
          `${tempRelative} is not a file`,
          'method approveFile'
        );
      }

      // checking existence of the destination folder
      try {
        stats = fsLib.statSync(newPathDir);
      } catch(e) {
        // does not exist
        if (e.code == 'ENOENT') {
          throw new Meteor.Error(
            'DIR_ERR',
            `Directory [${doc.dirPath}] does not exist`,
            'method approveFile'
          );
        }
      }

      if (!stats.isDirectory()) {
        // if it is not a folder
        throw new Meteor.Error(
          'assertion error',
          `[${doc.dirPath}] is not a directory`,
          'method approveFile'
        );
      }

      // checking existence of moving file in the destination folder
      const newPath = pathLib.join(newPathDir, doc.nameOrigin);

      try {
        stats = fsLib.statSync(newPath);
      } catch(e) {}

      // checking existing object for is a file:
      if (stats && stats.isFile()) {
        throw new Meteor.Error(
          'FILE_ERR',
          `File [${doc.nameOrigin}] already exists in [${doc.dirPath}] folder`,
          'method approveFile'
        );
      }

      // moving the file from temp folder to shared
      fsLib.renameSync(tempPath, newPath);

      // find the parent in FilesTree
      const parent = findDirByPath(doc.dirPath);

      // updating the FilesTree to make a reaction on the Client
      FilesTree.insert({
        title: doc.nameOrigin,
        expanded: false,
        parent: parent._id,
        folder: false
      });

      // removing temp document
      TempFile.remove(doc);
    },

    removeRevision(docId) {
      check(docId, String);

      const doc = TempFile.findOne({_id: docId});

      if (!doc) {
        throw new Meteor.Error(
          'assertion error',
          `A document with finding query {_id: '${docId}'} does not exist`,
          'method removeRevision'
        );
      }

      const tempPath = pathLib.join(tempFolder, doc.name);

      // does not metter is there a file or not, we will try to delete it
      try {
        fsLib.unlinkSync(tempPath);
      } catch(e) {}

      // removing temp document
      TempFile.remove(doc);
    },

    createFolder(docId) {
      check(docId, String);

      const doc = TempFile.findOne({_id: docId});

      if (!doc) {
        throw new Meteor.Error(
          'assertion error',
          `A document with finding query {_id: '${docId}'} does not exist`,
          'method removeRevision'
        );
      }

      // 1t stage: initiating
      const basenameShared = pathLib.basename(sharedFolder);
      let dirs = doc.dirPath.split('/');
      let currentDir = pathLib.dirname(sharedFolder);
      let parent = null;

      // 2d stage: create all directories from root to latest subdir
      dirs.forEach(function(item, index, arr) {
        if (item) {
          let stats = null;
          currentDir = pathLib.join(currentDir, item);

          const createIt = function() {
            fsLib.mkdirSync(currentDir, '775');

            // updating the FilesTree to make a reaction on the Client
            FilesTree.insert({
              title: item,
              expanded: false,
              parent: parent ? parent._id : null,
              folder: true
            });
          }

          try {
            stats = fsLib.statSync(currentDir);

            if (!stats.isDirectory()) {
              createIt();
            }
          } catch(e) {
            if (e.code == 'ENOENT') {
              createIt();
            } else {
              throw e;
            }
          }

          // new parent
          parent = FilesTree.findOne({
            title: item,
            parent: parent ? parent._id : null,
            folder: true
          });
        }
      });
    }
  });
}
