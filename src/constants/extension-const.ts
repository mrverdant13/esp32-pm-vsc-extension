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

import * as joiner from "../joiner";

// Extension supported OSs.
export const SupportedOSs: Array<string> = [
    'win32',
    'linux',
];


// Serial action types.
export enum SerialActionType {
    Flash = 0,
    Monitor = 1,
    FlashAndMonitor = 2,
}

export namespace Paths {
    // Available serial ports generator bash file.
    export const SerialPortGeneratorFile: string = joiner.joinPaths('assets/scripts/GenerateSerialPortsList.sh');

    // Project template.
    export const ProjectTemplate: string = joiner.joinPaths('assets/templates/project');

    // VSCode workspace settings template.
    export const VscSettingsFile: string = joiner.joinPaths(ProjectTemplate, '.vscode/settings.json');

    // VSCode workspace C/C++ properties template.
    export const VscCCppPropsFile: string = joiner.joinPaths(ProjectTemplate, '.vscode/c_cpp_properties.json');
}