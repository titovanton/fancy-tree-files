import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';

export const FilesTree = new Mongo.Collection('FilesTree');
export const TempFile = new Mongo.Collection('TempFile');

if (Meteor.isServer) {
  Meteor.publish('files.tree', function filesTreePublication() {
    return FilesTree.find({}, { sort: { folder: -1, title: 1 } } );
  });

  Meteor.publish('temp.file', function filesTreePublication() {
    return TempFile.find( {});
  });
}
