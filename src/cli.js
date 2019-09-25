#!/usr/bin/env node

const VERSION = process.env.npm_package_version;

const commander = require('commander');
const program = new commander.Command();
program.version(VERSION);

program
  .option('-l --localPath', 'all files inside this path get uploaded via sftp')
  .option('-r --remotePath', 'remote path has to exist on remote host')
  .option('-h --host', 'host address')
  .option('-u --user', 'host user')

program.parse(process.argv);

const prompt = require('prompt');

prompt.start();

prompt.get({properties: {password: {hidden: true, replace: '*'}}}, function (err, result) {
 
  const upload = require('./ftp-upload.js');

  upload(
    localPath, 
    remotePath, 
    host, 
    user, 
    result.password
  )
})

