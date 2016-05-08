#!/usr/bin/env bash

apt-get update
apt-get upgrade -y
apt-get install -y htop
apt-get install -y git

# hostname
hostname fancy-tree
echo "127.0.0.1 fancy-tree" >> /etc/hosts
echo "fancy-tree" > /etc/hostname

# .bashrc
echo "cd /vagrant/project" >> /home/vagrant/.bashrc

# node
apt-get autoremove -y node
apt-get install -y build-essential
curl -sL https://deb.nodesource.com/setup_4.x | bash -
apt-get install -y nodejs

# bower
npm install -g bower

# meteor
curl https://install.meteor.com/ | sh

# MongoDB
apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv EA312927
echo "deb http://repo.mongodb.com/apt/ubuntu trusty/mongodb-enterprise/stable multiverse" | tee /etc/apt/sources.list.d/mongodb-enterprise.list
sudo apt-get update
sudo apt-get install -y mongodb-enterprise

# Mongo URL
command="export MONGO_URL='mongodb://localhost:27017/fancy-tree'"
echo $command >> /home/vagrant/.bashrc

# inotify-tools
apt-get install -y inotify-tools

# project
cd /vagrant
meteor create project
# git clone https://github.com/titovanton/fancy-tree.git project
cd /vagrant/project
meteor npm install

# project folders
mkdir -p /vagrant/project/tests
mkdir -p /vagrant/project/imports/api
mkdir -p /vagrant/project/imports/startup/client
mkdir -p /vagrant/project/imports/startup/server
mkdir -p /vagrant/project/imports/ui/components
mkdir -p /vagrant/project/imports/ui/layouts
mkdir -p /vagrant/project/imports/ui/pages

# custom packages tune
# meteor remove insecure
# meteor remove autopublish
# meteor remove jquery
# meteor add titovanton:jquery-custom
# meteor add titovanton:dropzone
# meteor add titovanton:fancy-tree
# meteor add tomi:upload-server

echo "You need to run the following command:"
echo "git submodule add https://github.com/titovanton/meteor-tomi-upload-server.git"
