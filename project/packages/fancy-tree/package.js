Package.describe({
  name: 'titovanton:fancy-tree',
  version: '0.0.2',
  summary: 'jQuery Fancy tree implementation for Meteor',
  git: '',
  documentation: 'README.md'
});

Package.onUse(function(api) {
  api.versionsFrom('1.3.1');
  api.use('ecmascript');
  api.use('jquery', 'client');
  api.addFiles('lib/jquery-ui.custom.js', 'client');
  api.addAssets([
    'dist/skin-win8/icons.gif',
    'dist/skin-win8/loading.gif'
  ], 'client');
  api.addFiles('dist/skin-win8/ui.fancytree.min.css', 'client');
  api.addFiles('dist/jquery.fancytree-all.js', 'client');
});
