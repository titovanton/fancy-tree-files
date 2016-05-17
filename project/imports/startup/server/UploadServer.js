import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

import { tempFolder } from '../../fs/sync.js';
import { relativePathOf } from '../../fs/sync.js';

import { FilesTree } from '../../api/FilesTree.js';
import { TempFile } from '../../api/TempFile.js';

const pathLib = require('path');

Meteor.startup(function () {
  UploadServer.init({
    tmpDir: '/home/vagrant/.uploads/tmp',
    uploadDir: tempFolder,
    uploadUrl: '/upload/',
    checkCreateDirectories: true,

    finished: function(fileInfo, formFields) {
      check(formFields.nodeKey, String);
      check(formFields.nameOrigin, String);

      let objToInsert = Object.create(null);
      // name of the file in the temp folder
      objToInsert.name = fileInfo.name;
      // original name of the file
      objToInsert.nameOrigin = formFields.nameOrigin;
      // parent document in FilesTree
      // objToInsert.parent = formFields.nodeKey;

      // path of the node, where we've droped the file or folder
      const nodePath = relativePathOf(
        FilesTree.findOne({_id: formFields.nodeKey}),
        FilesTree
      );

      // final directory in which the file should be placed after approval
      if (formFields.dirPath) {
        check(formFields.dirPath, String);
        objToInsert.dirPath = pathLib.join(nodePath, formFields.dirPath);
      } else {
        objToInsert.dirPath = nodePath;
      }

      TempFile.insert(objToInsert);
    }
  });
});
