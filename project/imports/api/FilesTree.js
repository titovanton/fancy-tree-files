import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';

export const FilesTree = new Mongo.Collection('FilesTree');

if (Meteor.isServer) {
  Meteor.publish('files.tree', function filesTreePublication() {
    return FilesTree.find( {}, { sort: { folder: -1, title: 1 } } );
  });
}
