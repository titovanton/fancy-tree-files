import { Meteor } from 'meteor/meteor';

Meteor.startup(function() {
  jQuery(($) => {

    Dropzone.autoDiscover = false;
    dropzoneList = new Object(null);
  });
});
