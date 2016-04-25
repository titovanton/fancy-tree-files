import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';

import './body.html';

Template.body.events({
  'click #upload'(event, instance) {
    Meteor.call('uploadCallback');
  }
});
