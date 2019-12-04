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

import { ProjectAssets } from './assets';

import { Project } from './project';
import { EspressifProj } from './espressif_proj';
import { UninitEsp32pmProj } from './uninit_esp32pm_proj';

import { Idf } from '../resources/idf';
import { Msys32 } from '../resources/msys32';
import { Xtensa } from '../resources/xtensa';

export class InitEsp32pmProj extends Project {
    protected constructor() {
        super();
    }

    // Mandatory folders.
    protected static readonly MandatoryFiles: Array<string> = [
        ProjectAssets.VscCCppPropsFile,
        ProjectAssets.VscSettingsFile,
    ];

    // Initialized ESP32-PM project validation.
    public static async validate(context: vscode.ExtensionContext) {
        try {
            // Espressif project validation.
            await EspressifProj.validate();

            // Uninitialized ESP32-PM project validation.
            await UninitEsp32pmProj.validate();

            // Check if the active workspace contains a valid initialized project folder.
            if (!(await this.isValidProjectFolder())) {
                throw Error('This ESP32-PM project is not initialized.');
            }

            // Registered ESP-IDF validation.
            await Idf.validate(context);

            // Resource validation for Windows.
            if (process.platform === 'win32') {
                // Registered MSYS32 validation.
                await Msys32.validate(context);
            }
            // Resource validation for Linux.
            else if (process.platform === 'linux') {
                // Registered XTENSA validation.
                await Xtensa.validate(context);
            }
        } catch (error) { throw error; }
    }
}