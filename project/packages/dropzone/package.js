Package.describe({
  name: 'titovanton:dropzone',
  version: '0.0.2',
  // Brief, one-line summary of the package.
  summary: 'Dropzone client lib.',
  // URL to the Git repository containing the source code for this package.
  git: '',
  // By default, Meteor will default to using README.md for documentation.
  // To avoid submitting documentation, set this field to null.
  documentation: 'README.md'
});

Package.onUse(function(api) {
  api.versionsFrom('1.3.1');
  api.addFiles('dropzone.js', 'client');
});
