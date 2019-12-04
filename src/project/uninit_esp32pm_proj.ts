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

import { ProjectAssets } from './assets';
import { Project } from './project';
import { EspressifProj } from './espressif_proj';

export class UninitEsp32pmProj extends Project {
    protected constructor() {
        super();
    }

    // Mandatory folders.
    protected static readonly MandatoryFolders: Array<string> = [
        ProjectAssets.SubProjectsFolder,
    ];

    // Uninitialized ESP32-PM project validation.
    public static async validate() {
        try {
            // Espressif project validation.
            await EspressifProj.validate();

            // Check if the active workspace contains a valid uninitialized project folder.
            if (!(await this.isValidProjectFolder())) {
                throw Error('This is not an ESP32-PM project.');
            }
        } catch (error) { throw error; }
    }
}