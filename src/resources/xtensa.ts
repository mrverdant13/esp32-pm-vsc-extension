import * as vscode from 'vscode';

import { Resource } from "./resource";

export class Xtensa extends Resource {
    protected constructor() {
        super();
    }

    // Resource label.
    protected static readonly label: string = '"xtensa"';

    // Resource field.
    protected static readonly field: string = 'XTENSA_PATH';

    // Mandatory folders.
    protected static readonly MandatoryFolders: Array<string> = [
        'bin/',
        'include/',
        'lib/',
        'libexec/',
        'share/',
        'xtensa-esp32-elf/',
    ];

    // Two level settings (JSON).
    protected static readonly TwoLevelSettings: Array<[string, Array<[string, Array<string>]>]> = [
        [
            'terminal.integrated.env.linux',
            [
                [
                    'XTENSA_PATH',
                    ['', '']
                ]
            ]
        ],
        [
            'terminal.integrated.env.linux',
            [
                [
                    'PATH',
                    ['', '/bin:${env:PATH}']
                ]
            ]
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
                throw Error('The ' + this.label + ' folder has not been registered or is not valid. Execute the "Set \'xtensa-esp32-elf\' folder" command');
            }
        } catch (error) { throw error; }
    }
}