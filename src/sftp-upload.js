const fs = require('fs');

function flattenDeep(arr1) {
  return arr1.reduce((acc, val) => Array.isArray(val) ? acc.concat(flattenDeep(val)) : acc.concat(val), []);
}

async function getFolderTree(source_folder, remote_folder, sub_folder){
  return new Promise((resolve, reject) => {
    fs.readdir(`${source_folder}${sub_folder}`, (err, files) => {
      if (err) reject(err);  
      let promise_result = []  
      files.forEach(file => {
        let promise = new Promise((resolve, reject) => {
          fs.stat(`${source_folder}${sub_folder}/${file}`, (err, stats) =>{
            if (err) reject(err);
            if (stats.isDirectory()) {
              getFolderTree(source_folder, remote_folder, `${sub_folder}/${file}`)
                .then(fileList => {
                  console.log('sub_folder', sub_folder)
                  resolve([{type: 'dir', remote: `${remote_folder}${sub_folder}/${file}`}, ...fileList])
                });
            } else {
              resolve({type: 'file', local: `${source_folder}${sub_folder}/${file}`, remote: `${remote_folder}${sub_folder}/${file}`})
            }
          })
        })
        promise_result.push(promise)
      });
      resolve(Promise.all(promise_result))
    });
  });
}

async function uploadFiles(sftp, session, files){
  logFile = fs.createWriteStream('./sftp.log')
  while (!logFile.writable) {}

  for(file of files) {
    if (file.type === 'dir'){
      try{
        console.log(await sftp.mkdir(file.remote, session));
      } catch (err){

      }
    } else {
      let success = false;
      try{
        success = await sftp.put(file.local, file.remote, session);
      } catch(err){
        logFile.write(`failed for file: ${file.remote}\n${err}\n`)
        console.error(err)
      }
      logFile.write(success ? `success for file: ${file.remote}` : '');      
      console.log(success ? `wrote ${file.remote}` : `failed to write ${file.remote}`);
    }
  }
  logFile.end()
}

module.exports = (function(localPath, remotePath, host, user, password){
  const config = {host: host, username: user, password: password};
  const SFTPClient = require('sftp-promises');
  const sftp = new SFTPClient();

  console.log(localPath, '-->', remotePath)
  getFolderTree(localPath, remotePath, '')
    .then(nestedFileList => flattenDeep(nestedFileList))
    .then(fileList => {
      // console.log(fileList)
      sftp.session(config).then(function(session) {
        uploadFiles(sftp, session, fileList)
          .then(() => {
            console.log('closing')
            session.end()
          })
      })
    })
})




