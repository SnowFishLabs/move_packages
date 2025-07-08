import env from "./env.json"
import shell from 'shelljs';

function build_package() {
    let cmd = `aptos move build --included-artifacts none --save-metadata --named-addresses ${env.CONTRACT_ADDRESS_NAME}=${env.OBJECT_ADDRESS}`;

    shell.exec(cmd, { fatal: true })
}

build_package();