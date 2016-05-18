const pathLib = require('path');

import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { check } from 'meteor/check';

import { TempFile } from '../../api/TempFile.db.js';

import './approval.tpl.html'

Template.approval.onCreated(function() {
  Meteor.subscribe('temp.file');
});

Template.approval.helpers({
  flatList() {
    return TempFile.find({});
  }
});

Template.approval.events({
  'click .approve-it'() {
    Meteor.call('approveFile', this._id, (err, res) => {
      if (err) {
        // console.log(err);

        const errMsg1 = err.reason +
          '.\nDo you want to create this folder?';
        const errMsg2 = err.reason +
          '.\nDo you want to replace it with the new one?';

        if (err.error == 'DIR_ERR' && confirm(errMsg1)) {
          // create folder if the user wants that
          Meteor.call('createFolder', this._id, (err, res) => {
            if (err) {
              console.log(err);
            } else {
              alert('The folder created. Press "approve" button again.');
            }
          });
        } else if (err.error == 'FILE_ERR' && confirm(errMsg2)) {
          // replace existence file with the new one
          console.log('replace');
        }
      }
    });
  },

  'click .remove-it'() {
    Meteor.call('removeRevision', this._id, (err, res) => {
      if (err) {
        console.log(err);
      }
    });
  }
});
