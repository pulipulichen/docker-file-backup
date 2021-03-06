const { exec } = require("child_process")

module.exports = function (cmd, mute = true) {

  if (typeof(stderrHandler) !== 'function') {
    stderrHandler = function (stderr) {
      console.log(`[STDERR] ${stderr}`);
    }
  }

  if (typeof(errorHandler) !== 'function') {
    errorHandler = function (error, reject) {
      //console.log(`[ERROR]\n${error.message}`)
      reject(error)
      return
    }
  }

  return new Promise(function (resolve, reject) {
    exec(cmd , (error, stdout, stderr) => {
      if (error) {
        return errorHandler(error, reject)
      }
      if (stderr) {
        stderrHandler(stderr);
      }

      if (stdout.trim() !== '') {
        if (mute) {
          console.log(`[STDOUT] ${stdout}`)
        }
        
      }
      
      resolve(`[STDOUT]\n${stdout}`)
    });
  })
}