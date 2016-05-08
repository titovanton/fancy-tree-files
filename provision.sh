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
cd /vagrant/project
meteor npm install

git submodule init
git submodule update

# echo "You need to run the following command:"
# echo "git submodule init"
# echo "git submodule update"
