const pathLib = require('path');

import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session'
import { Template } from 'meteor/templating';
import { check } from 'meteor/check';

import { FilesTree } from '../../api/FilesTree.db.js';

import './fancytree.tpl.html'

// Non reactive get method
Session.getNonReactive = function (key) {
  return Tracker.nonreactive(function () { return Session.get(key); });
};

let fromFlatToFancySource = function(childList) {
  let parent;
  let nodeMap = {};
  const expandedKeys = Session.getNonReactive('expandedKeys') || [];

  // Pass 1: store all items in reference map
  $.each(childList, function(index, child) {
    // Rename 'key' to 'id' first
    try {
      check(child._id, {str: String});
      child.key = child._id._str;
    } catch(e) {
      child.key = child._id;
    }

    delete child._id;

    // expanded
    const expanded = expandedKeys.indexOf(child.key) >= 0;
    child.expanded = child.expanded || expanded;

    nodeMap[child.key] = child;
  });

  // Pass 2: adjust fields and fix child structure
  childList = $.map(childList, function(child) {
    // Check if it is a child node
    if (child.parent) {

      // add child to `children` array of parent node
      parent = nodeMap[child.parent];

      if (parent && parent.children) {
        parent.children.push(child);
      } else if (parent) {
        parent.children = [child];
      }

      // Remove child from childList
      return null;
    }

    // Keep top-level nodes
    return child;
  });

  return childList;
}

let fancyData = (source) => {
  return {
    source: source,
    // extensions: ['dnd', 'filter', 'persist'],
    extensions: ['dnd', 'filter'],
    toggleEffect: false,

    persist: {
      expandLazy: false,
      types: 'expanded'
    },

    click(event, data) {
      const node = data.node;
      let keys = Session.get('expandedKeys');

      // custom persist implementation
      if (!keys) {
        // first use
        Session.set('expandedKeys', []);
        keys = [];
      }

      if (node.expanded) {
        // we've closed the folder
         const index = keys.indexOf(node.key);

         if (index >= 0) {
           keys.splice(index, 1);
         }
      } else {
        // we've opened the folder
        keys.push(node.key);
      }

      Session.set('expandedKeys', keys);
    },

    createNode(event, data) {
      const node = data.node;

      // create Dropzone objects for every folder
      // if there is a goust of the Dropzone object, then delete it
      if (node.folder) {
        const key = node.key;

        if (Object.keys(window.dropzoneList).indexOf(key) + 1) {
          window.dropzoneList[key].destroy();
        }

        window.dropzoneList[key] = new window.Dropzone(node.span, {
          url: `/upload/`,
          createImageThumbnails: false,
          clickable: false,
          previewsContainer: false,
          acceptedFiles: '.jpg,.yml,.zip',

          init: function() {
            this.on('sending', function(file, xhr, formData) {
              // the key of the node where we've just droped the file
              formData.append('nodeKey', key);
              // the name could be changed if in the temp folder exists file
              // with the same name
              formData.append('nameOrigin', file.name);

              if (file.fullPath) {
                // if we've droped the directory, then we should pass the path
                // of it per file
                formData.append('dirPath', pathLib.dirname(file.fullPath));
              }
            }).on('addedfile', function(file) {
              if(!confirm(`Do you want to upload the file ${file.name}?`)){
                  this.removeFile(file);
                  return false;
              }

              return true;
            });
          }
        });
      }
    },

    create(event, data) {
      // runs on tree render complited (only once on init)
      $(event.target).data('isCreated', true);
    },

    dnd: {
      autoExpandMS: 400,
      focusOnClick: true,
      preventVoidMoves: true,
      preventRecursiveMoves: true,

      dragStart: function(node, data) {
        return true;
      },

      dragEnter: function(node, data) {
        if (node.folder) {
          return 'over';
        } else {
          return false;
        }
      },

      dragDrop: function(destinationNode, data) {
        const targetNode = data.otherNode;
        Meteor.call('mv', targetNode.key, destinationNode.key, (err, res) => {
          if (err) {
            console.error(err.error);
          } else {
            targetNode.moveTo(destinationNode, data.hitMode);
          }
        });
      }
    },

    filter: {
      autoApply: true,
      counter: true,
      hideExpandedCounter: true,
      mode: 'hide'
    }
  };
}

Template.fancytree.onCreated(function() {
  Meteor.subscribe('files.tree');
});

Template.fancytree.helpers({
  reloadFancyTree() {
    const $tree = $('#tree');
    // on fancytree 'create' event
    const isCreated = $tree.data('isCreated');
    const objectList = FilesTree.find({}).fetch();
    const source = fromFlatToFancySource(objectList);

    if (isCreated) {
      $tree.fancytree('destroy');
    }

    try {
      $tree.fancytree(fancyData(source));
    } catch (e) {}
  }
});

Template.fancytree.events({
  'keyup #search'(event, instance) {
    const tree = $('#tree').fancytree('getTree');

    if (!event.target.value) {
      tree.clearFilter();
    } else {
      tree.filterNodes(event.target.value, {autoExpand: true});
    }
  }
});
