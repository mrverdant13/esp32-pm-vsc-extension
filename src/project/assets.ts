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

import * as PathUtils from '../utils/path';

export namespace ProjectAssets {

    // Sub-projects folder name.
    export const SubProjectsFolderName: string = 'src';

    // Generated available serial ports list temporal file name.
    export const TempGeneratedSerialPortsFileName: string = 'tempSerialPortsFile.txt';

    // Generated available serial ports list final file name.
    export const FinalGeneratedSerialPortsFileName: string = 'finalSerialPortsFile.txt';

    // Generated include paths list temporal file name.
    export const TempGeneratedIncludePathsFileName: string = 'tempIncludePathsFile.txt';

    // Generated include paths list final file name.
    export const FinalGeneratedIncludePathsFileName: string = 'finalIncludePathsFile.txt';

    // Project Make file.
    export const ProjMakeFile: string = 'Makefile';

    // Project CMake file.
    export const CMakeListsFile: string = 'CMakeLists.txt';

    // Project main folder.
    export const MainFolder: string = 'main';

    // VSCode workspace settings file.
    export const VscSettingsFile: string = '.vscode/settings.json';

    // VSCode workspace C/C++ properties file.
    export const VscCCppPropsFile: string = '.vscode/c_cpp_properties.json';

    // Sub-projects folder.
    export const SubProjectsFolder: string = PathUtils.joinPaths('main', SubProjectsFolderName);

    // Generated available serial ports list temporal file.
    export const TempGeneratedSerialPortsFile: string = PathUtils.joinPaths('build', TempGeneratedSerialPortsFileName);

    // Generated available serial ports list final file.
    export const FinalGeneratedSerialPortsFile: string = PathUtils.joinPaths('build', FinalGeneratedSerialPortsFileName);

    // Generated include paths list temporal file.
    export const TempGeneratedIncludePathsFile: string = PathUtils.joinPaths('build', TempGeneratedIncludePathsFileName);

    // Generated include paths list final file.
    export const FinalGeneratedIncludePathsFile: string = PathUtils.joinPaths('build', FinalGeneratedIncludePathsFileName);
}