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

async function uploadSingleFile(sftp, file){
  try{
    success = await sftp.put(file.local, file.remote)
    await logFile.write(!success ? `failed for file: ${file.remote}\n` : '');      
    console.log(success ? `wrote ${file.remote}` : `failed to write ${file.local} to ${file.remote}`);  
  } catch(err){
    await logFile.write(`failed for file: ${file.remote}\n${err}\n`)
    console.error(err)
  }
}

async function uploadFiles(sftp, files){
  logFile = fs.createWriteStream('./sftp.log')
  while (!logFile.writable) {}
  let result_promises = [];

  for(file of files) {
    if (file.type === 'dir'){
      try{
        await sftp.mkdir(file.remote);
      } catch (err){

      }
    } else {
      uploadSingleFile(sftp, file);
    }
  }
  
  return Promise.all(result_promises)
    .then(logFile.end());
}

module.exports = (function(localPath, remotePath, host, user, password){
  const config = {host: host, username: user, password: password};
  const SFTPClient = require('sftp-promises');
  const sftp = new SFTPClient(config);

  console.log(localPath, '-->', remotePath)
  getFolderTree(localPath, remotePath, '')
    .then(nestedFileList => flattenDeep(nestedFileList))
    .then(fileList => {
      uploadFiles(sftp, undefined, fileList)
        .then(() => {
          console.log('finished')
        });
    })
})




