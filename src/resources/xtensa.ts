/*
Copyright (c) 2019 Karlo Fabio Verde Salvatierra

All rights reserved.

MIT License

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

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