/**
 * This module contains listner callback for the async native node fs.watch function.
 * See more: https://nodejs.org/api/fs.html#fs_fs_watch_filename_options_listener
 * You should think about it like a library, there are no invocations here.
 */

 // namespace for the libraries
 const lib = {
   fs: require('fs'),
   path: require('path'),
   chokidar: require('chokidar')
 };

import { sharedFolder } from './sync.js';
import { fromFStoDB } from './sync.js';
import { fromDBtoFS } from './sync.js';
import { recursiveFolder } from './fs.api.js';

export const watcher = (folder = sharedFolder) => {

  lib.chokidar
    .watch(folder, {ignored: /[\/\\]\./})
    .on('all', (event, path) => {
      console.log(event, path);
    });
}
