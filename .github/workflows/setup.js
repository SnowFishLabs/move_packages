let package = {
  "name": "move_packages",
  "version": "1.0.0",
  "dependencies": {
    "@octokit/core": "^7.0.3"
  }
};

var fs = require('fs');
var cwd = process.cwd();

function main() {
    let package_path = `${cwd}/package.json`;
    fs.writeFileSync(package_path, JSON.stringify(package, null, 2));    
}

main();