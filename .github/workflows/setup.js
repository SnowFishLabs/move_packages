var fs = require('fs');
var cwd = process.cwd();

export function setup() {
  let package_json = {
    "name": "move_packages",
    "version": "1.0.0",
    "dependencies": {
      "@octokit/core": "^7.0.3"
    }
  };

  let package_path = `${cwd}/package.json`;
  fs.writeFileSync(package_path, JSON.stringify(package_json, null, 2));
}
