Package.describe({
  name: 'titovanton:jquery-custom',
  version: '2.2.3',
  // Brief, one-line summary of the package.
  summary: 'jQuery v2.2.3',
  // URL to the Git repository containing the source code for this package.
  git: '',
  // By default, Meteor will default to using README.md for documentation.
  // To avoid submitting documentation, set this field to null.
  documentation: 'README.md'
});

Package.onUse(function(api) {
  api.versionsFrom('1.3.1');
  api.addFiles('jquery.min.js', 'client');
});
