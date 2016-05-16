import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';

export const TempFile = new Mongo.Collection('TempFile');

if (Meteor.isServer) {
  Meteor.publish('temp.file', function filesTreePublication() {
    return TempFile.find( {}, { sort: { folder: -1, title: 1 } } );
  });
}
