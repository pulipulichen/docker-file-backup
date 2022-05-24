const fs = require('fs');
const path = require('path');

const SOURCE_PATH = '/data_source'
const BACKUP_PATH = '/data_backup'

const ShellSpawn = require('./lib/ShellSpawn.js')

async function main () {
  let filesInSource = fs.readdirSync(SOURCE_PATH)
  if (filesInSource.length > 0) {
    for (let i = 0; i < filesInSource.length; i++) {
      let folder = path.join(SOURCE_PATH, filesInSource[i])
      console.log(folder)
      let output = await ShellSpawn([`ls`, `-l`, folder])
      console.log({output})
      //let subFiles = fs.readFileSync(folder)
      //if (subFiles.length > 0) {
      if (output !== 'total 0') {
        console.log(filesInSource[i]);
        console.log(output)

        console.log(filesInSource[i] + ' is not empty. Restore is stopped.')
        return false
      }
    }
  }
  else {
    let filesInBackup = fs.readdirSync(BACKUP_PATH)

    if (filesInBackup.length > 0) {
      console.log("Restore start.")
      await ShellSpawn(`ls -l ${BACKUP_PATH}`)
      await ShellSpawn(`cp -rf ${BACKUP_PATH}/* ${SOURCE_PATH}`)
      console.log("Restore is completed.")
    }
    else {
      console.log(`${BACKUP_PATH} is empty. Restore is stopped.`)
    }
  }
}

main()