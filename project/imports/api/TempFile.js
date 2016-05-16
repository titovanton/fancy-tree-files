const path = require('path');
const fs = require('fs');

import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';

import { tempFolder } from '../fs/sync.js';
import { sharedFolder } from '../fs/sync.js';

import { FilesTree } from './FilesTree.js';

export const TempFile = new Mongo.Collection('TempFile');

if (Meteor.isServer) {
  Meteor.publish('temp.file', function filesTreePublication() {
    return TempFile.find( {});
  });

  Meteor.methods({
    approveFile(docId) {
      const doc = TempFile.findOne({_id: docId});
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
          throw new Meteor.Error(`File ${tempRelative} does not exist`);
        }
      }

      if (!stats.isFile()) {
        // if it is not a file
        throw new Meteor.Error(`${tempRelative} is not a file`);
      }

      // checking existence of the destination folder
      try {
        stats = fs.statSync(newPathDir);
      } catch(e) {
        // does not exist
        if (e.code == 'ENOENT') {
          throw new Meteor.Error(`Directory ${doc.dirPath} does not exist`);
        }
      }

      if (!stats.isDirectory()) {
        // if it is not a folder
        throw new Meteor.Error(`${doc.dirPath} is not a directory`);
      }

      // moving the file from temp folder to shared
      fs.renameSync(tempPath, path.join(newPathDir, doc.nameOrigin));

      // updating the FilesTree to make a reaction on the Client
      FilesTree.insert({
        title: doc.nameOrigin,
        expanded: false,
        parent: doc.parent,
        folder: false
      });

      // removing temp document
      TempFile.remove(doc);
    }
  })
}
