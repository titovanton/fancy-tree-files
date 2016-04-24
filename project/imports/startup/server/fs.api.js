/**
 * API to standart library 'fs', makes it looks like sh/bash commands such as:
 * ls, cd, mkdir, etc.
 */

const lib = {
  fs: require('fs'),
  path: require('path')
}

/**
 * Async.
 * Equal to bash command 'ls -a'.
 * Does not ignore entries starting with '.'.
 * @param path - a sthing with path to.
 * @param fn - callback function.
 * @return nothing.
 * Parameters of callback functin:
 * @param err - an error object.
 * @param list - an array of files and directories.
 * @return ls function expects nothing from callback.
 */
export const ls = (path, fn) => {
  lib.fs.readdir(path, fn);
}

/**
 * Async.
 * Equal to bash command 'ls -al'.
 * Does not ignore entries starting with '.'.
 * Passes attributes of files and directories to the callback.
 * @param path - a sthing with path to.
 * @param fn - callback function.
 * @return nothing.
 * Parameters of the callback functin:
 * @param err - an error object.
 * @param list - an array of objects.
 * @return lsl function expects nothing from callback.
 */
export const lsl = (path, fn) => {
  lib.fs.readdir(path, (err, dirList) => {
    if (err) return fn(err, null);

    let listOfObj = [];

    dirList.forEach( (item, i, lst) => {
      const statsObj = lib.fs.statSync(lib.path.join(path, item));
      let fileObj = Object.create(null);

      fileObj.name = item;
      fileObj.isDirectory = statsObj.isDirectory();
      fileObj.dev = statsObj.dev;
      fileObj.mode = statsObj.mode;
      fileObj.nlink = statsObj.nlink;
      fileObj.uid = statsObj.uid;
      fileObj.gid = statsObj.gid;
      fileObj.rdev = statsObj.rdev;
      fileObj.blksize = statsObj.blksize;
      fileObj.ino = statsObj.ino;
      fileObj.size = statsObj.size;
      fileObj.blocks = statsObj.blocks;
      fileObj.atime = statsObj.atime;
      fileObj.mtime = statsObj.mtime;
      fileObj.ctime = statsObj.ctime;

      listOfObj.push(fileObj);
    });

    fn(err, listOfObj);
  });
}

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
    const list = lib.fs.readdirSync(dirPath);

    list.forEach((name, i, lst) => {
      const absPath = lib.path.join(dirPath, name);
      // posix attributes
      const statsObj = lib.fs.statSync(absPath);

      if (statsObj.isDirectory()) {
        dirStack.push(absPath);
      }

      fn(name, absPath, dirPath, statsObj);
    });

    dirPath = dirStack.pop();
  }
}
