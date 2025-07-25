var child_process = require("child_process");
var Octokit = require("@octokit/core");
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

    let workflow_path = `${cwd}/ghscripts`;

    let cmd = `npm version patch`;

    console.log(cmd);

    runInDir(cmd, workflow_path);
}

async function getPackageVersion() {
    const octokit = new Octokit.Octokit({
        auth: process.env.NODE_AUTH_TOKEN
    })

    let repo = process.env.GITHUB_REPOSITORY;
    let repos = repo.split('/');

    let package_name = repos[1];
    let org_name = repos[0];

    let results = await octokit.request('GET /orgs/{org}/packages/{package_type}/{package_name}/versions', {
        package_type: 'npm',
        package_name: package_name,
        org: org_name,
        per_page: 1,
    })

    if (results.status == 200 && results.data.length > 0) {
        return results.data[0].name;
    }

    return ""
}

// function pushNpmVersion() {
//     console.log("pushNpmVersion");

//     let dir = cwd;

//     runInDir(`git config --global user.email "fantasyni@163.com"`, dir);
//     runInDir(`git config --global user.name "justin"`, dir);
//     runInDir(`git add ghscripts/package.json`, dir);
//     runInDir(`git commit -m 'bump version ${getVersion()}'`, dir);

//     const githubDomain = process.env['INPUT_CUSTOM-GIT-DOMAIN'] || 'github.com'
//     let remoteRepo = `https://${process.env.GITHUB_ACTOR}:${process.env.NODE_AUTH_TOKEN}@${githubDomain}/${process.env.GITHUB_REPOSITORY}.git`;

//     runInDir(`git push ${remoteRepo}`, dir);
// }

function syncPackageJson() {
    console.log("run packages");
    console.log(cwd);

    let workflow_path = `${cwd}/ghscripts`;

    let build_dir = get_build_dir();

    sync_files.forEach(function (name) {
        let from = `${workflow_path}/${name}`;
        let to = `${build_dir}/${name}`;

        console.log(`copy ${from} to ${to}`);

        fs.copyFileSync(from, to);
    });
}

// function getVersion() {
//     let package_path = `${cwd}/ghscripts/package.json`;
//     if (package_path) {
//         let content = fs.readFileSync(package_path).toString();
//         let package_json = JSON.parse(content);

//         return package_json.version;
//     }

//     return "";
// }

function writeVersion(version) {
    let package_path = `${cwd}/ghscripts/package.json`;
    if (package_path) {
        let content = fs.readFileSync(package_path).toString();
        let package_json = JSON.parse(content);

        package_json.version = version;

        console.log(package_json);
        fs.writeFileSync(package_path, JSON.stringify(package_json, null, 2))
    }
}

function get_build_dir() {
    let cwd = process.cwd();

    let build_path = `${cwd}/build`;
    let build_dirs = fs.readdirSync(build_path);
    let build_dir = build_dirs[0];
    return `${build_path}/${build_dir}`;
}

async function main() {
    let version = await getPackageVersion();
    writeVersion(version);
    bumpNpmVersion();
    syncPackageJson();
    publishPackage();
    // pushNpmVersion();
}

main();