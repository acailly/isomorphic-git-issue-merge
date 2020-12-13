const exec = require("child_process").exec;

// From https://medium.com/@ali.dev/how-to-use-promise-with-exec-in-node-js-a39c4d7bbf77
module.exports = function execShellCommand(cmd, cwd) {
  return new Promise((resolve, reject) => {
    exec(
      cmd,
      {
        cwd,
      },
      (error, stdout, stderr) => {
        if (error) {
          reject(error);
        }
        resolve(stdout ? stdout : stderr);
      }
    );
  });
};
