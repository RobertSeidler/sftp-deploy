#!/usr/bin/env node

const VERSION = process.env.npm_package_version;

const commander = require('commander');
const program = new commander.Command();
program.version(VERSION);

program
  .option('-l --localPath <type>', 'all files inside this path get uploaded via sftp')
  .option('-r --remotePath <type>', 'remote path has to exist on remote host')
  .option('-h --host <type>', 'host address')
  .option('-u --user <type>', 'host user')

program.parse(process.argv);

const prompt = require('prompt');

prompt.start();

prompt.get({properties: {password: {hidden: true, replace: '*'}}}, function (err, result) {
 
  const upload = require('./sftp-upload.js');

  upload(
    program.localPath, 
    program.remotePath, 
    program.host, 
    program.user, 
    result.password
  )
})

