import * as vscode from 'vscode';

import { Resource } from "./resource";

export class Xtensa extends Resource {
    protected constructor() {
        super();
    }

    protected static readonly label: string = '"xtensa"';

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
            await this.registerResource(context, this.label, this.field);
        } catch (error) { throw error; }
    }

    public static async validate(context: vscode.ExtensionContext) {
        try {
            if (!await this.isRegisteredAndValid(context, this.field)) {
                throw Error('The ' + this.label + ' folder has not been registered or is not valid. Execute the "Set \'xtensa-esp32-elf\' folder" command');
            }
        } catch (error) { throw error; }
    }
}