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
echo "cd /fancytree/project" >> /home/fancytree/.bashrc

# clone repo
git clone https://github.com/titovanton/fancy-tree-files.git /fancytree

# nginx
apt-get install -y nginx
rm /etc/nginx/sites-enabled/default
cp /fancytree/nginx.conf /etc/nginx/sites-available/fancytree
ln -s /etc/nginx/sites-available/fancytree /etc/nginx/sites-enabled/fancytree

service nginx reload

# MongoDB
apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv EA312927
echo "deb http://repo.mongodb.com/apt/ubuntu trusty/mongodb-enterprise/stable multiverse" | tee /etc/apt/sources.list.d/mongodb-enterprise.list
apt-get update
apt-get install -y mongodb-enterprise

# backups
cp /fancytree/mongodb-backup /etc/cron.d/mongodb-backup

# node
add-apt-repository -y ppa:chris-lea/node.js
apt-get update
apt-get install -y nodejs
apt-get install -y g++ make

# upstart
cp /fancytree/upstart.conf /etc/init/fancytree.conf

# meteor
curl https://install.meteor.com | /bin/sh

(cd /fancytree/project && meteor build /fancytree)
(cd /fancytree && tar -zxf project.tar.gz)
(cd /fancytree/bundle/programs/server && npm install)

chown fancytree:fancytree /fancytree -R
