var child_process = require("child_process");
var fs = require("fs");

let cwd = process.cwd();
let sync_files = ["package.json"];

function publishPackage() {
    let build_dir = get_build_dir();

    let cmd = `npm publish --registry https://npm.pkg.github.com`;

    console.log(cmd);

    child_process.execSync(cmd, {
        cwd: build_dir,
        encoding: "utf-8",
        stdio: 'inherit'
    })
}

function syncPackageJson() {
    console.log("run packages");
    console.log(cwd);

    let ghscripts_path = `${cwd}/ghscripts`;

    let build_dir = get_build_dir();

    sync_files.forEach(function (name) {
        let from = `${ghscripts_path}/${name}`;
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
    syncPackageJson();
    publishPackage();
}

main();