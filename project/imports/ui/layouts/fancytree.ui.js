import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { check } from 'meteor/check';

import { FilesTree } from '../../api/FilesTree.js';

import './fancytree.html'

let fromFlatToFancySource = function(childList, expandedList = []) {
  let parent;
  let nodeMap = {};

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
    nodeMap[child.key] = child;
    // child.extraClasses = `key-${child.key}`;
    // nodeMap[child.path] = child;
  });

  // Pass 2: adjust fields and fix child structure
  childList = $.map(childList, function(child) {
    // asigne expanded
    // if ( expandedList.indexOf(child.key) >= 0 ) {
    //   child.expanded = true;
    // }

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
    extensions: ['dnd', 'filter', 'persist'],

    persist: {
      expandLazy: false,
      types: 'expanded'
    },

    createNode: (event, data) => {
      // create Dropzone objects for every folder
      // if there is a goust of the Dropzone object, then delete it
      const node = data.node;

      if (node.folder) {
        const key = node.key;
        const nodePath = node.data.path;

        if (Object.keys(dropzoneList).indexOf(key) + 1) {
          dropzoneList[key].destroy();
        }

        dropzoneList[key] = new Dropzone(node.span, {
          url: `/upload/?nodePath=${nodePath}`,
          createImageThumbnails: false,
          clickable: false,
          previewsContainer: false,

          init: function() {
            this.on("sending", Meteor.wrapAsync((file, xhr, formData) => {
              formData.set('fullPath', file.fullPath);
            }));

            // this.on("sendingmultiple", Meteor.wrapAsync((file, xhr, formData) => {
            //   console.log("sendingmultiple", formData);
            // }));
          }
        });
      }
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
  Meteor.subscribe('hello.files');
});

Template.fancytree.helpers({
  reloadFancyTree() {
    const $tree = $('#tree');
    const expandedList = $tree.data('expandedList');
    const objectList = FilesTree.find({}).fetch();
    const source = fromFlatToFancySource(objectList, expandedList);

    if (!expandedList) {

      try {
        $tree.fancytree(fancyData(source));
      } catch (e) {}

      $tree.data('expandedList', []);
    } else {
      const tree = $tree.fancytree('getTree');

      try {
        tree.reload(source);
      } catch (e) {}
    }
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
