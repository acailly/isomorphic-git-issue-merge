const git = require("isomorphic-git");
const makeDir = require("make-dir");
const rimraf = require("rimraf");
const path = require("path");
const fs = require("fs");
const execShellCommand = require("./execShellCommand");

async function reproduceBug() {
  // --- Informations ---
  // Alice uses native git
  // Bob uses isomorphic git
  // Charlie uses native git

  // Clean all
  const localFolder = path.join(__dirname, "sandbox");
  if (fs.existsSync(localFolder)) {
    rimraf.sync(localFolder);
  }
  await makeDir(localFolder);

  // Create the remote, a bare repo
  const remoteFolder = path.join(localFolder, "remote");
  await makeDir(remoteFolder);
  await execShellCommand(`git init --bare`, remoteFolder);

  // Alice clone the repo
  await execShellCommand(`git clone ./remote alice`, localFolder);
  const aliceFolder = path.join(localFolder, "alice");

  // Alice initialize the repo
  await execShellCommand(`echo INIT > INIT.txt`, aliceFolder);
  await execShellCommand(`git add .`, aliceFolder);
  await execShellCommand(`git commit -m "Init repo"`, aliceFolder);
  await execShellCommand(`git push origin master`, aliceFolder);

  // Bob clone the repo
  await execShellCommand(`git clone ./remote bob`, localFolder);
  const bobFolder = path.join(localFolder, "bob");
  await execShellCommand(`git fetch origin master`, bobFolder);
  await git.checkout({
    fs,
    dir: bobFolder,
    remote: "origin",
    ref: "master",
  });

  // Charlie clone the repo
  await execShellCommand(`git clone ./remote charlie`, localFolder);
  const charlieFolder = path.join(localFolder, "charlie");

  // Alice add a file
  await execShellCommand(`echo TOTO > TOTO.txt`, aliceFolder);
  await execShellCommand(`git add .`, aliceFolder);
  await execShellCommand(`git commit -m "Add a file"`, aliceFolder);
  await execShellCommand(`git push origin master`, aliceFolder);

  // Bob fetch the remote with native git
  await execShellCommand(`git fetch origin master`, bobFolder);

  // Bob merge the remote with isomorphic git
  await git.merge({
    fs,
    dir: bobFolder,
    theirs: `remotes/origin/master`,
    author: {
      // TODO ACY
      name: "Mr. Test",
      email: "mrtest@example.com",
    },
  });

  // BUG ! Element added by Alice is marked as deleted
  const bobStatus = await execShellCommand(`git status --short`, bobFolder);
  console.log("BOB STATUS:", bobStatus);

  // Charlie fetch the remote with native git
  await execShellCommand(`git fetch origin master`, charlieFolder);

  // Charlie merge the remote with native git
  await execShellCommand(`git merge origin master`, charlieFolder);

  // OK ! Element added by Alice is here
  const charlieStatus = await execShellCommand(
    `git status --short`,
    charlieFolder
  );
  console.log("CHARLIE STATUS:", charlieStatus);
}

reproduceBug();
