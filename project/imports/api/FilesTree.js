import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';

export const FilesTree = new Mongo.Collection('FilesTree');

if (Meteor.isServer) {
  Meteor.publish('hello.files', function filesTreePublication() {
    return FilesTree.find( {}, { sort: { folder: -1, title: 1 } } );
  });
}

Meteor.methods({
  getChildrens(parent = null) {
    let found;

    if (parent) {
      found = FilesTree.find({ parent: parent }).fetch();
    } else {
      found = FilesTree.find({ parent: { $exists: false } }).fetch();
    }

    return found.map( (item) => {
      return {
        key: item._id._str,
        folder: item.folder,
        title: item.title
      };
    } );
  }
});
