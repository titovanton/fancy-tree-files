const pathLib = require('path');
const fslib = require('fs');

import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

import { TempFile } from './TempFile.db.js';
import { FilesTree } from './FilesTree.db.js';

import { tempFolder } from '../api/sync.api.js';
import { sharedFolder } from '../api/sync.api.js';
import { fromFStoDB } from '../api/sync.api.js';
import { findDirByPath } from '../api/sync.api.js';

if (Meteor.isServer) {
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

      const tempPath = pathLib.join(tempFolder, doc.name);
      const tempRelative = pathLib.join('temp', doc.name);
      const newPathDir = pathLib.join(pathLib.dirname(sharedFolder), doc.dirPath);
      let stats = null;

      // checking file in temp folder
      try {
        stats = fslib.statSync(tempPath);
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
        stats = fslib.statSync(newPathDir);
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
        stats = fslib.statSync(newPath);
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
      fslib.renameSync(tempPath, newPath);

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
        fslib.unlinkSync(tempPath);
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
            fslib.mkdirSync(currentDir, '775');

            // updating the FilesTree to make a reaction on the Client
            FilesTree.insert({
              title: item,
              expanded: false,
              parent: parent ? parent._id : null,
              folder: true
            });
          }

          try {
            stats = fslib.statSync(currentDir);

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
