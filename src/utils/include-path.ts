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

import * as FileUtils from './file';
import * as PathUtils from './path';
import * as TerminalUtils from './terminal';
import * as TimeUtils from './time';
import * as VscUtils from './vsc';

import { ProjectAssets } from '../project/assets';

export async function getIncludePaths(context: vscode.ExtensionContext): Promise<Array<string>> {
    try {
        // Create a watcher for the include paths file deletion.
        const fsw: vscode.FileSystemWatcher = vscode.workspace.createFileSystemWatcher(PathUtils.joinPaths('**', ProjectAssets.TempGeneratedIncludePathsFile), true, true, false);
        var includePaths: Array<string> = [];
        var includePathsChecked: boolean = false;

        // When the include paths file is deleted, get the found include paths.
        fsw.onDidDelete(
            async () => {
                const fileContent = (await FileUtils.readFile(PathUtils.joinPaths(VscUtils.getWorkspacePath(), ProjectAssets.FinalGeneratedIncludePathsFile)));
                if (fileContent.length > 0) {
                    includePaths = fileContent.split("\n");
                }
                includePathsChecked = true;
            }
        );

        // Execute the shell commands to get include paths.
        TerminalUtils.executeShellCommands(
            "Update include paths",
            [
                'echo -e "ESP32-PM: Updating include paths...\n"',
                'make generate-includes TEMP_INCLUDES_FILE=' + ProjectAssets.TempGeneratedIncludePathsFile + ' FINAL_INCLUDES_FILE=' + ProjectAssets.FinalGeneratedIncludePathsFile,
            ]
        );

        // Wait until all include paths are set.
        while (!includePathsChecked) {
            await TimeUtils.delay(100);
        }

        // Delete the watcher.
        fsw.dispose();

        // Return the found include paths.
        return [
            ...includePaths,
            "${env:MSYS32_PATH}/opt/xtensa-esp32-elf/xtensa-esp32-elf/sys-include/**",
            "${env:XTENSA_PATH}/xtensa-esp32-elf/sys-include/**",
        ];
    } catch (error) {
        throw error;
    }
}
