import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { check } from 'meteor/check';

import { FilesTree } from '../../api/FilesTree.js';

import './fancytree.html'

let fromFlatToFancySource = function(childList, expandedList) {
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

    child.class='asdf'

    delete child._id;

    nodeMap[child.key] = child;
    // nodeMap[child.path] = child;
  });

  // Pass 2: adjust fields and fix child structure
  childList = $.map(childList, function(child) {
    // asigne expanded
    if ( expandedList.indexOf(child.key) >= 0 ) {
      child.expanded = true;
    }

    // Check if it is a child node
    if (child.parent) {

      // add child to `children` array of parent node
      parent = nodeMap[child.parent];

      if (parent.children) {
        parent.children.push(child);
      } else {
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

let fancyData = (source, expandedList) => {
  return {
    source: fromFlatToFancySource(source, expandedList),
    extensions: ['dnd', 'filter'],

    click: function(event, data) {
      const node = data.node;

      if (node.folder) {
        let expandedList = $(this).data('expandedList');

        if (!node.expanded) {
          expandedList.push(node.key);
        } else {
          expandedList.splice(expandedList.indexOf(node.key), 1);
        }

        $(this).data('expandedList', expandedList);
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
  initFancyTree() {
    const $treeObj = $('#treeObj');

    if ($treeObj.data('expandedList')) {
      // it was initiated once

      try {
        $treeObj.fancytree('destroy');
      } catch (err) {}
    } else {
      // default value for expanded nodes list
      $treeObj.data('expandedList', []);
    }

    const objectList = FilesTree.find({}).fetch();

    try {
      const data = fancyData(objectList, $treeObj.data('expandedList'));
      $treeObj.fancytree(data);
    } catch (err) {}

    $('.fancytree-folder').dropzone({ url: "/upload/" });
  }
});

Template.fancytree.events({
  'keyup #search'(event, instance) {
    const tree = $('#treeObj').fancytree('getTree');

    if (!event.target.value) {
      tree.clearFilter();
    } else {
      tree.filterNodes(event.target.value, {autoExpand: true});
    }
  }
});
