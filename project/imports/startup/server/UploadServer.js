import { Meteor } from 'meteor/meteor';

import { sharedFolder } from '../../fs/sync.js';

const path = require('path');

Meteor.startup(function () {
  UploadServer.init({
    tmpDir: '/home/vagrant/.uploads/tmp',
    uploadDir: sharedFolder,
    uploadUrl: '/upload/',
    checkCreateDirectories: true,

    getDirectory: function(req, fileInfo, formFields) {
      const dirPath = path.join(
        req.query['nodePath'],
        path.dirname(formFields.fullPath)
      ).replace(/^\/|\/$/g, '');

      // console.log(dirPath);
      return dirPath;
    }
  });
});
