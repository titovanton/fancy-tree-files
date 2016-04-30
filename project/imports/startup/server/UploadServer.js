Meteor.startup(function () {
  UploadServer.init({
    tmpDir: '/home/vagrant/.uploads/tmp',
    uploadDir: '/home/vagrant/.uploads/',
    uploadUrl: '/upload/',
    checkCreateDirectories: true //create the directories for you
  });
});
