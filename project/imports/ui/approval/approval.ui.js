const pathLib = require('path');

import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { check } from 'meteor/check';

import { TempFile } from '../../api/TempFile.js';

import './approval.html'

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
        console.log(err);
      }
    });
  }
});
