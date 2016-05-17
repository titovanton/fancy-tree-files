const path = require('path');
const fs = require('fs');

import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { check } from 'meteor/check';

import { tempFolder } from '../fs/sync.js';
import { sharedFolder } from '../fs/sync.js';
import { fromFStoDB } from '../fs/sync.js';

import { FilesTree } from './FilesTree.js';

export const TempFile = new Mongo.Collection('TempFile');

if (Meteor.isServer) {
  Meteor.publish('temp.file', function filesTreePublication() {
    return TempFile.find( {});
  });

  Meteor.methods({
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

      const tempPath = path.join(tempFolder, doc.name);
      const tempRelative = path.join('temp', doc.name);
      const newPathDir = path.join(path.dirname(sharedFolder), doc.dirPath);
      let stats = null;

      // checking file in temp folder
      try {
        stats = fs.statSync(tempPath);
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
        stats = fs.statSync(newPathDir);
      } catch(e) {
        // does not exist
        if (e.code == 'ENOENT') {
          throw new Meteor.Error(
            'ENOENT1',
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
      const newPath = path.join(newPathDir, doc.nameOrigin);

      try {
        stats = fs.statSync(newPath);

        // checking existing object for is a file:
        if (stats.isFile()) {
          throw new Meteor.Error(
            'assertion error',
            `File [${doc.nameOrigin}] already exists in [${doc.dirPath}] folder`,
            'method approveFile'
          );
        }
      } catch(e) {}

      // moving the file from temp folder to shared
      fs.renameSync(tempPath, newPath);

      // TODO: find the parent in FilesTree
      // doc.dirPath

      // updating the FilesTree to make a reaction on the Client

      FilesTree.insert({
        title: doc.nameOrigin,
        expanded: false,
        parent: doc.parent,
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

      const tempPath = path.join(tempFolder, doc.name);

      // does not metter is there a file or not, we will try to delete it
      try {
        fs.unlinkSync(tempPath);
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
      const basenameShared = path.basename(sharedFolder);
      let dirs = doc.dirPath.split('/');
      let currentDir = path.dirname(sharedFolder);
      let parent = null;
      // let parent = FilesTree.findOne({
      //   title: basenameShared,
      //   parent: null,
      //   folder: true
      // });
      //
      // // sync FS and DB
      // if (!parent) {
      //   fromFStoDB();
      // }
      //
      // // lets try one more time
      // parent = FilesTree.findOne({
      //   title: basenameShared,
      //   parent: null,
      //   folder: true
      // });
      //
      // // finnal error throw
      // if (!parent) {
      //   throw new Meteor.Error(
      //     'assertion error',
      //     'A document with finding query ' +
      //     `{title: ${basenameShared}, ` +
      //     'parent: null, folder: true} does not exist',
      //     'method createFolder'
      //   );
      // }

      // 2d stage: create all directories from root to latest subdir
      dirs.forEach(function(item, index, arr) {
        if (item) {
          let stats = null;
          currentDir = path.join(currentDir, item);

          const createIt = function() {
            fs.mkdirSync(currentDir, '775');

            // updating the FilesTree to make a reaction on the Client
            FilesTree.insert({
              title: item,
              expanded: false,
              parent: parent ? parent._id : null,
              folder: true
            });
          }

          try {
            stats = fs.statSync(currentDir);

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
  })
}
