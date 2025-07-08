import { get_build_dir } from "./utils";
import shell from 'shelljs';

function publishPackage() {
    let build_dir = get_build_dir();

    let cmd = `npm publish`;

    console.log(cmd);

    shell.cd(build_dir);
    shell.exec(cmd, { fatal: true })
}

publishPackage();