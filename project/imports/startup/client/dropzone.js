import { Meteor } from 'meteor/meteor';

Meteor.startup(function() {
  Dropzone.autoDiscover = false;
  dropzoneList = new Object(null);
});
