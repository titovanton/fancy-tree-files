/**
 * This module contains implementation of syncing between folder and MongoDB.
 * You should think about it like a library, there are no invocations here.
 */

// namespace for the libraries
const lib = {
  fs: require('fs'),
  path: require('path')
  // chokidar: require('chokidar')
};

import { Meteor } from 'meteor/meteor';

import { FilesTree } from '../api/FilesTree.js';

import { recursiveFolder } from './fs.api.js';

export const sharedFolder = '/home/vagrant/folder';
export const sharedTitle = 'folder';

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

  let relativePath = lib.path.join('/', document.title);
  let tmp = document;

  while (tmp.parent) {
    if (documentsMap) {
      tmp = documentsMap[tmp.parent];
    } else {
      tmp = collection.findOne({_id: tmp.parent});
    }

    relativePath = lib.path.join('/', tmp.title, relativePath);
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
  return lib.path.join(
    lib.path.dirname(sharedFolder),
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
  const affected = findOneAndUpdate(
    collection,
    {parent: null, title: sharedTitle},
    {parent: null, title: sharedTitle, expanded: true, folder: true}
  );

  // maping path to mongo _id
  const parentsMap = new Object(null);
  const sharedFolderRelative = lib.path.join('/', sharedTitle);
  parentsMap[sharedFolderRelative] = affected._id;

  // to make relative path, replace the following
  const absReplace = lib.path.dirname(path);

  recursiveFolder(path, (name, absPath, parentDir, statsObj) => {
    // Object {title, parent, folder, expanded}
    let fileObj = Object.create(null);
    // const parent = lib.path.dirname(absPath).replace(path, '');
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

  const pathParent = lib.path.dirname(path);

  // gousts checking
  allDocuments.forEach((item, i, arr) => {
    const absPath = absPathOf(item, null, documentsMap);

    // posix attributes
    try {
      lib.fs.statSync(absPath);
    } catch (err) {

      // does not exist
      if (err.errno == 34) {
        collection.remove({_id: item._id});
      }
    }
  });
}

/**
 * While fs lib does not support good watch method:
 * https://nodejs.org/api/fs.html#fs_caveats
 * we have to use(on Linux) inotify-tools and node api to that(chokidar):
 * https://github.com/paulmillr/chokidar
 * This function runs watcher on the folder and binds change events recursively.
 * @param folderPath a string argument
 * @param collection an collection object
 * @return nothing
 */
export const watcher = (folderPath = sharedFolder, collection = FilesTree) => {
  const watcher = lib.chokidar.watch(folderPath, {ignored: /[\/\\]\./});
  // while .on method is async, it is required to wrapp method with Meteor.wrapAsync
  const onSync = Meteor.wrapAsync(watcher.on, watcher);

  onSync('addDir', (path, stats) => {
    // Object {name, parent, path}
    let fileObj = Object.create(null);

    fileObj.title = lib.path.basename(path);

    if (folderPath == path) {
      fileObj.path = '/';
      fileObj.expanded = true;
    } else {
      fileObj.path = path.replace(folderPath, '');
      const parent = lib.path.dirname(path);

      if (folderPath == parent) {
        fileObj.parent = '/';
      } else {
        fileObj.parent = parent.replace(folderPath, '');
      }
    }

    fileObj.folder = true;

    const updatedId = collection.upsert(
      {path: fileObj.path},
      fileObj
    );
  });

  onSync('add', (path, stats) => {
    // Object {name, parent, path}
    let fileObj = Object.create(null);

    fileObj.title = lib.path.basename(path);
    fileObj.path = path.replace(folderPath, '');
    const parent = lib.path.dirname(path);

    if (folderPath == parent) {
      fileObj.parent = '/';
    } else {
      fileObj.parent = parent.replace(folderPath, '');
    }

    fileObj.folder = false;

    const updatedId = collection.upsert(
      {path: fileObj.path},
      fileObj
    );
  });

  onSync('unlink', (path, stats) => {
    collection.remove({path: path.replace(folderPath, '')});
  });
}
