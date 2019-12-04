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

import { SerialAction } from '../extension/serial-action';

import { ExtensionPaths } from '../extension/paths';

import { ProjectAssets } from '../project/assets';

export async function getSerialPorts(context: vscode.ExtensionContext): Promise<Array<string>> {
    try {
        // Execute the Windows commands to list the available COM ports.
        TerminalUtils.executeShellCommands(
            'Generate serial ports',
            [
                'echo -e "ESP32-PM: Generating serial ports list...\n"',
                'export tempSerialPortsFile="' + ProjectAssets.TempGeneratedSerialPortsFile + '"',
                'export finalSerialPortsFile="' + ProjectAssets.FinalGeneratedSerialPortsFile + '"',
                'export platform="' + process.platform + '"',
                'bash ' + PathUtils.joinPaths(context.asAbsolutePath(ExtensionPaths.SerialPortGeneratorFile)),
            ]
        );

        // Create a watcher for the serial ports file deletion.
        const fsw: vscode.FileSystemWatcher = vscode.workspace.createFileSystemWatcher(PathUtils.joinPaths('**', ProjectAssets.TempGeneratedSerialPortsFile), true, true, false);
        var serialPorts: Set<string> = new Set();
        var serialPortsChecked: boolean = false;

        // When the serial ports file is deleted, get the found serial ports.
        fsw.onDidDelete(
            async () => {
                const fileContent = (await FileUtils.readFile(PathUtils.joinPaths(VscUtils.getWorkspacePath(), ProjectAssets.FinalGeneratedSerialPortsFile)));
                if (fileContent.length > 0) {
                    serialPorts = new Set(fileContent.split("\n"));
                }
                serialPortsChecked = true;
            }
        );

        // Wait until all serial ports are checked.
        while (!serialPortsChecked) {
            await TimeUtils.delay(100);
        }

        // Delete the watcher.
        fsw.dispose();

        if (serialPorts.size === 0) {
            throw Error('No serial port available.');
        }

        // Return the found serial ports.
        return [...serialPorts];
    } catch (error) {
        throw error;
    }
}
