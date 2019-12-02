import * as vscode from 'vscode';

import { Resource } from "./resource";

export class Idf extends Resource {
    protected constructor() {
        super();
    }

    protected static readonly label: string = 'ESP-IDF API';

    protected static readonly field: string = 'IDF_PATH';

    protected static readonly MandatoryFolders: Array<string> = [
        'components',
        'examples',
    ];

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
            await this.registerResource(context, this.label, this.field);
        } catch (error) { throw error; }
    }

    public static async validate(context: vscode.ExtensionContext) {
        try {
            if (!await this.isRegisteredAndValid(context, this.field)) {
                throw Error('The ' + this.label + ' folder has not been registered or is not valid. Execute the "Set ESP-IDF API folder" command.');
            }
        } catch (error) { throw error; }
    }
}