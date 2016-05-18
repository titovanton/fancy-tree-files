/**
 * API to standart library 'fs', makes it looks like sh/bash commands such as:
 * ls, cd, mkdir, etc.
 */

fsLib = require('fs');
pathLib = require('path');

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
