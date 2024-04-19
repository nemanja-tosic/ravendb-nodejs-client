import fs from "node:fs";
import path from "node:path";
import { ChildProcess, spawn } from "node:child_process";
import { RavenServerLocator } from "./RavenServerLocator";
import { throwError } from "../../src/Exceptions";

interface ProcessStartInfo {
    command: string;
    arguments: string[];
}

const EMPTY_SETTINGS_TEMP = path.join(process.cwd(), "test_server_settings.json");

export abstract class RavenServerRunner {

    public static run(locator: RavenServerLocator): ChildProcess {
        const processStartInfo = this._getProcessStartInfo(locator);
        return spawn(processStartInfo.command, processStartInfo.arguments);
    }

    private static _getProcessStartInfo(locator: RavenServerLocator): ProcessStartInfo {
        if (!locator) {
            throwError("InvalidArgumentException", "Locator instance is mandatory.");
        }
        const serverPath = locator.getServerPath();
        if (!fs.existsSync(serverPath)) {
            throwError("FileNotFoundException", `Server file was not found: ${locator.getServerPath()}`);
        }

        fs.writeFileSync(EMPTY_SETTINGS_TEMP, "{}");

        const commandArguments = [
            `--config-path`,
            `${EMPTY_SETTINGS_TEMP}`,
            "--RunInMemory=true",
            "--License.Eula.Accepted=true",
            "--Setup.Mode=None",
            "--Logs.Mode=None",
            `--Testing.ParentProcessId=${ process.pid }`,
            ...locator.getCommandArguments()
        ];

        return {
            command: locator.getCommand(),
            arguments: commandArguments
        };
    }
}
