Package.describe({
  name: 'titovanton:fancy-tree',
  version: '0.0.7',
  summary: 'jQuery Fancy tree implementation for Meteor',
  git: '',
  documentation: 'README.md'
});

Package.onUse(function(api) {
  api.versionsFrom('1.3.1');
  api.use('titovanton:jquery-custom', 'client');
  api.addFiles('lib/jquery.cookie.min.js', 'client');
  api.addFiles('lib/jquery-ui.min.js', 'client');
  api.addAssets([
    'lib/icons.gif',
    'lib/loading.gif'
  ], 'client');
  api.addFiles('lib/ui.fancytree.min.css', 'client');
  api.addFiles('lib/jquery.fancytree-all.min.js', 'client');
});
