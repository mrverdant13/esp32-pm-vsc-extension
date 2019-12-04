import * as vscode from 'vscode';

import { Resource } from "./resource";

export class Idf extends Resource {
    protected constructor() {
        super();
    }

    // Resource label.
    protected static readonly label: string = 'ESP-IDF API';

    // Resource field.
    protected static readonly field: string = 'IDF_PATH';

    // Mandatory folders.
    protected static readonly MandatoryFolders: Array<string> = [
        'components',
        'examples',
    ];

    // Two level settings (JSON).
    protected static readonly TwoLevelSettings: Array<[string, Array<[string, Array<string>]>]> = [
        [
            'terminal.integrated.env.windows',
            [
                [
                    'IDF_PATH',
                    ['', '']
                ]
            ]
        ],
        [
            'terminal.integrated.env.linux',
            [
                [
                    'IDF_PATH',
                    ['', '']
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
                throw Error('The ' + this.label + ' folder has not been registered or is not valid. Execute the "Set ESP-IDF API folder" command.');
            }
        } catch (error) { throw error; }
    }
}