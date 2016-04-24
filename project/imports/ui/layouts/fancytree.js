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
    // nodeMap[child._id] = child;
    nodeMap[child.path] = child;
  });

  // Pass 2: adjust fields and fix child structure
  childList = $.map(childList, function(child) {

    // Rename 'key' to 'id'
    try {
      check(child._id, {str: String});
      child.key = child._id._str;
    } catch(e) {
      child.key = child._id;
    }

    delete child._id;

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
    }
  }
}

Template.fancytree.onCreated(function() {
  Meteor.subscribe('hello.files');
});

Template.fancytree.helpers({
  initFancyTree() {
    const $treeObj = $('#treeObj');

    if ($treeObj.data('expandedList')) {
      // it was initiated once
      $treeObj.fancytree('destroy');
    } else {
      // default value for expanded nodes list
      $treeObj.data('expandedList', []);
    }

    const cursor = FilesTree.find({});
    const data = fancyData(cursor.fetch(), $treeObj.data('expandedList'));
    $treeObj.fancytree(data);
  }
});
