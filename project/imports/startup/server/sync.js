/**
 * This module contains implementation of syncing between folder and MongoDB.
 * You should think about it like a library, there are no invocations here.
 */

// namespace for the libraries
const lib = {
  fs: require('fs'),
  path: require('path'),
  chokidar: require('chokidar')
};

import { FilesTree } from '../../api/FilesTree.js';

import { recursiveFolder } from './fs.api.js';

export const sharedFolder = '/home/vagrant/folder';
export const sharedTitle = 'folder';

/**
 * While db.collection.findOneAndUpdate is not implemented in Meteor,
 * we need to create it custom. See more:
 * https://docs.mongodb.org/manual/reference/method/db.collection.findOneAndUpdate/#db.collection.findOneAndUpdate
 * Attantion, update should contains filter data as well.
 * @param collection - a collection object
 * @param filter - an object
 * @param update - an object.
 * @return updated/inserted document _id
 */
const findOneAndUpdate = (collection, filter, update) => {
  let document = collection.findOne(filter);

  if (!document) {
    collection.insert(update);
    document = collection.findOne(filter);
  } else {
    collection.update(filter, update);
  }

  return document._id;
}

/**
 * Syncing folder with MongoDB.
 *
 * @param path a string argument
 * @param collection an collection object
 * @return nothing
 */
export const fromFStoDB = (path = sharedFolder, collection = FilesTree) => {
  // maping path to mongo _id
  let pathMap = Object.create(null);
  const updatedId = findOneAndUpdate(
    collection,
    {path: '/'},
    {title: sharedTitle, path: '/', expanded: true, folder: true}
  );

  pathMap[sharedFolder] = updatedId;

  recursiveFolder(path, (name, absPath, parentDir, statsObj) => {
    // Object {name, parent, path}
    let fileObj = Object.create(null);
    const isDirectory = statsObj.isDirectory();

    fileObj.title = name;
    fileObj.path = absPath.replace(path, '');
    fileObj.parent = pathMap[parentDir];
    fileObj.folder = isDirectory;

    const updatedId = findOneAndUpdate(
      collection,
      {path: fileObj.path},
      fileObj
    );

    if (isDirectory) {
      pathMap[absPath] = updatedId;
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

  allDocuments.forEach((item, i, arr) => {
    const absPath = lib.path.join(path, item.path);

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
  // on start lets sync root folder
  // const updatedId = findOneAndUpdate(
  //   collection,
  //   {path: '/'},
  //   {title: sharedTitle, path: '/', expanded: true, folder: true}
  // );

  const watcher = lib.chokidar.watch(folderPath, {ignored: /[\/\\]\./});
  // while .on method is async, it is required to wrapp method with Meteor.wrapAsync
  const syncOn = Meteor.wrapAsync(watcher.on, watcher);

  syncOn('addDir', (path, stats) => {
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

    const updatedId = findOneAndUpdate(
      collection,
      {path: fileObj.path},
      fileObj
    );
  });

  syncOn('add', (path, stats) => {
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

    const updatedId = findOneAndUpdate(
      collection,
      {path: fileObj.path},
      fileObj
    );
  });

  syncOn('unlink', (path, stats) => {
    collection.remove({path: path.replace(folderPath, '')});
  });
}
