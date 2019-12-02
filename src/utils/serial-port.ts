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
