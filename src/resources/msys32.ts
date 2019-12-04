import * as vscode from 'vscode';

import { Resource } from "./resource";

export class Msys32 extends Resource {
    protected constructor() {
        super();
    }

    // Resource label.
    protected static readonly label: string = '"msys32"';

    // Resource field.
    protected static readonly field: string = 'MSYS32_PATH';

    // Mandatory folders.
    protected static readonly MandatoryFolders: Array<string> = [
        'home',
        'etc/profile.d',
    ];

    // One level settings (JSON).
    protected static readonly OneLevelSettings: Array<[string, Array<string>]> = [
        [
            'terminal.integrated.shell.windows',
            ['', '/usr/bin/bash.exe']
        ],
    ];

    public static async register(context: vscode.ExtensionContext) {
        try {
            // Register resource.
            await this.registerResource(context);
        } catch (error) { throw error; }
    }

    public static async validate(context: vscode.ExtensionContext) {
        try {
            // Check if the resource has been registered and is valid.
            if (!await this.isRegisteredAndValid(context)) {
                throw Error('The ' + this.label + ' folder has not been registered or is not valid. Execute the "Set \'msys32\' folder" command.');
            }
        } catch (error) { throw error; }
    }
}