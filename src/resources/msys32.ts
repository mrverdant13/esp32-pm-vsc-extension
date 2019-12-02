import * as vscode from 'vscode';

import { Resource } from "./resource";

export class Msys32 extends Resource {
    protected constructor() {
        super();
    }

    protected static readonly label: string = '"msys32"';

    protected static readonly field: string = 'MSYS32_PATH';

    // Mandatory folders.
    protected static readonly MandatoryFolders: Array<string> = [
        'home',
        'etc/profile.d',
    ];

    public static async validate(resourceAbsolutePath: string) {
        try {
            if (!(await this.isValidFolder(resourceAbsolutePath))) {
                throw Error('The selected folder is not an "msys32" one.');
            }
        } catch (error) {
            throw error;
        }
    }

    public static readonly OneLevelSettings: Array<[string, Array<string>]> = [
        [
            'terminal.integrated.shell.windows',
            ['', '/usr/bin/bash.exe']
        ],
    ];

    protected static readonly VscSettings: Object = {
        'terminal.integrated.shell.windows': 'RESOURCE/usr/bin/bash.exe',
    };

    public static async register(context: vscode.ExtensionContext) {
        try {
            await this.registerResource(context, this.label, this.field);
        } catch (error) { throw error; }
    }
}