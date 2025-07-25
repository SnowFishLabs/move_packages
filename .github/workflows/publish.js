var child_process = require("child_process");
var fs = require("fs");

let cwd = process.cwd();
let sync_files = ["package.json"];

function publishPackage() {
    let build_dir = get_build_dir();

    let cmd = `npm publish --registry https://npm.pkg.github.com`;

    console.log(cmd);

    runInDir(cmd, build_dir);
}

function runInDir(cmd, dir) {
    child_process.execSync(cmd, {
        cwd: dir,
        encoding: "utf-8",
        stdio: 'inherit'
    })
}

function bumpNpmVersion() {
    console.log("bumpNpmVersion");

    let workflow_path = `${cwd}`;

    runInDir(`git config --global user.email "fantasyni@163.com"`, workflow_path);
    runInDir(`git config --global user.name "justin"`, workflow_path);

    let cmd = `npm version patch`;

    console.log(cmd);

    runInDir(cmd, workflow_path);
}

function pushNpmVersion() {
    console.log("pushNpmVersion");

    let dir = cwd;

    runInDir(`git config --global user.email "fantasyni@163.com"`, dir);
    runInDir(`git config --global user.name "justin"`, dir);
    // runInDir(`git add package.json`, dir);
    runInDir(`git commit -a -m 'bump version'`, dir);

    const githubDomain = process.env['INPUT_CUSTOM-GIT-DOMAIN'] || 'github.com'
    let remoteRepo = `https://${process.env.GITHUB_ACTOR}:${process.env.NODE_AUTH_TOKEN}@${githubDomain}/${process.env.GITHUB_REPOSITORY}.git`;

    runInDir(`git push ${remoteRepo}`, dir);
}

function syncPackageJson() {
    console.log("run packages");
    console.log(cwd);

    let workflow_path = `${cwd}`;

    let build_dir = get_build_dir();

    sync_files.forEach(function (name) {
        let from = `${workflow_path}/${name}`;
        let to = `${build_dir}/${name}`;

        console.log(`copy ${from} to ${to}`);

        fs.copyFileSync(from, to);
    });
}

function get_build_dir() {
    let cwd = process.cwd();

    let build_path = `${cwd}/build`;
    let build_dirs = fs.readdirSync(build_path);
    let build_dir = build_dirs[0];
    return `${build_path}/${build_dir}`;
}

function main() {
    bumpNpmVersion();
    syncPackageJson();
    publishPackage();
    pushNpmVersion();
}

main();