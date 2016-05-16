import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';

import './body.html';

Template.body.events({
  'click #sync'(event, instance) {
    Meteor.call('uploadCallback');
  }
});
