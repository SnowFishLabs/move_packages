import { get_build_dir } from "./utils";
import env from "./env.json"
import shell from 'shelljs';
import fs from "fs";

function build_package() {
    let cmd0 = `npx large-package-payload-creator create --deploy-object true --output-format json`;
    let cmd = `${cmd0} --sender-address ${env.SENDER_ADDRESS} --contract-address-name ${env.CONTRACT_ADDRESS_NAME} --network ${env.NETWORK}`;

    console.log(cmd);
    let out = shell.exec(cmd, { fatal: true }).stdout;
    let out_json = JSON.parse(out);

    if (out_json.status == "success") {
        let files = out_json.file_names as string[];

        let build_dir = get_build_dir();

        let payload_info_path = `${build_dir}/payload_info.json`;
        
        console.log("write payload info %s", payload_info_path);

        fs.writeFileSync(payload_info_path, JSON.stringify(files, null, 2));

        files.forEach(function(file: string) {
            let payload_file_path = `${build_dir}/${file}`;

            console.log("copy payload %s", payload_file_path);
            fs.copyFileSync(file, payload_file_path);
        })
    } else {
        throw new Error(out);
    }
}

build_package();