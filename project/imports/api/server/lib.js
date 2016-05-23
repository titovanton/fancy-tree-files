/**
 * This module contains implementation of syncing between folder and MongoDB.
 * You should think about it like a library, there are no invocations here.
 */

fsLib = require('fs');
pathLib = require('path');

import { Meteor } from 'meteor/meteor';

import { FilesTree } from '../files.db.js';

export const sharedFolder = '/home/vagrant/folder';
export const tempFolder = '/home/vagrant/temp';

/**
 * Recursive listing of all files inside path
 * and all files inside of all folders and so on...
 * But using stack algorithm instead recursion, which uses less RAM.
 * About fs.Stats:
 * https://nodejs.org/api/fs.html#fs_class_fs_stats
 * @param path - path to root folder
 * @param fn - callback function
 * @return nothing.
 * Expected parameters of the callback functin:
 * @param name - the name of file or directory
 * @param absPath - the absolute path to
 * @param dirPath - the absolute path to parent dir
 * @param statsObj - result of fs.statSync
 */
export const recursiveFolder = (path, fn) => {
  // current dir path
  let dirPath = path;
  // stack of dir path
  let dirStack = [];

  while (dirPath) {
    // like $ ls -a
    const list = fsLib.readdirSync(dirPath);

    list.forEach((name, i, lst) => {
      const absPath = pathLib.join(dirPath, name);
      // posix attributes
      const statsObj = fsLib.statSync(absPath);

      if (statsObj.isDirectory()) {
        dirStack.push(absPath);
      }

      fn(name, absPath, dirPath, statsObj);
    });

    dirPath = dirStack.pop();
  }
}

/**
 * Find a document, which is projection
 * to the path.basename('/path/to/folder') subdir
 * @param { String } path
 * @return { MongoObject } projection of the latest subdir
 */
export const findDirByPath = (path, collection = FilesTree) => {
  let parent = null;
  const pathList = path.split('/');

  pathList.forEach(function(item, index, arr) {
    if (item) {
      parent = collection.findOne({
        title: item,
        parent: parent ? parent._id : null,
        folder: true
      });
    }
  });

  return parent;
}

/**
 * Recives the document and uses parent attribute to generate path recursively.
 * @param { MongoObject } document
 * @param { MongoCollection } collection
 * @param { Object } documentsMap - map _id to DB document, default - null
 * @return { String } relative path
 */
export const relativePathOf = (document, collection = null, documentsMap = null) => {
  if (!collection && !documentsMap) {
    throw Meteor.Error('collection and documentsMap can not be null both.');
  }

  let relativePath = pathLib.join('/', document.title);
  let tmp = document;

  while (tmp.parent) {
    if (documentsMap) {
      tmp = documentsMap[tmp.parent];
    } else {
      tmp = collection.findOne({_id: tmp.parent});
    }

    relativePath = pathLib.join('/', tmp.title, relativePath);
  }

  return relativePath;
}

/**
 * Makes result of invoking relativePathOf absolute.
 * @param { MongoObject } document
 * @param { MongoCollection } collection
 * @param { Object } documentsMap - map _id to DB document, default - null
 * @return { String } absolute path
 */
export const absPathOf = (document, collection = null, documentsMap = null) => {
  return pathLib.join(
    pathLib.dirname(sharedFolder),
    relativePathOf(document, collection, documentsMap)
  );
}

/**
 * While db.collection.findOneAndUpdate is not implemented in Meteor,
 * we need to create it custom. See more:
 * https://docs.mongodb.org/manual/reference/method/db.collection.findOneAndUpdate/#db.collection.findOneAndUpdate
 * Attantion, update should contains filter data as well.
 * @param collection - a collection object
 * @param filter - an object
 * @param update - an object.
 * @return updated/inserted document
 */
const findOneAndUpdate = (collection, filter, update) => {
  let document = collection.findOne(filter);

  if (!document) {
    collection.insert(update);
    document = collection.findOne(filter);
  } else {
    collection.update(filter, update);
  }

  return document;
}

/**
 * Syncing folder with MongoDB.
 *
 * @param path a string argument
 * @param collection an collection object
 * @return nothing
 */
export const fromFStoDB = (path = sharedFolder, collection = FilesTree) => {
  const shared = pathLib.basename(path);
  const affected = findOneAndUpdate(
    collection,
    {parent: null, title: shared},
    {parent: null, title: shared, expanded: true, folder: true}
  );

  // maping path to mongo _id
  const parentsMap = new Object(null);
  const sharedFolderRelative = pathLib.join('/', shared);
  parentsMap[sharedFolderRelative] = affected._id;

  // to make relative path, replace the following
  const absReplace = pathLib.dirname(path);

  recursiveFolder(path, (name, absPath, parentDir, statsObj) => {
    // Object {title, parent, folder, expanded}
    let fileObj = Object.create(null);
    // const parent = pathLib.dirname(absPath).replace(path, '');
    const parentPath = parentDir.replace(absReplace, '');

    fileObj.title = name;
    fileObj.expanded = false;
    fileObj.parent = parentsMap[parentPath];
    fileObj.folder = statsObj.isDirectory();

    const affected = findOneAndUpdate(
      collection,
      {parent: fileObj.parent, title: name},
      fileObj
    );

    if (fileObj.folder) {
      parentsMap[absPath.replace(absReplace, '')] = affected._id;
    }
  });
}

/**
 * Syncing MongoDB with folder.
 *
 * @param path a string argument
 * @param collection an collection object
 * @return nothing
 */
export const fromDBtoFS = (path = sharedFolder, collection = FilesTree) => {
  const allDocuments = collection.find({});
  // map id to document
  let documentsMap = Object.create(null);

  allDocuments.forEach((item, i, arr) => {
    documentsMap[item._id] = item;
  });

  const pathParent = pathLib.dirname(path);

  // gousts checking
  allDocuments.forEach((item, i, arr) => {
    const absPath = absPathOf(item, null, documentsMap);

    // posix attributes
    try {
      fsLib.statSync(absPath);
    } catch (err) {

      // does not exist
      if (err.errno == 34) {
        collection.remove({_id: item._id});
      }
    }
  });
}
