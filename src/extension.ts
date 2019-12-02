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

import { SerialAction } from './extension/serial-action';

import {
	ProjectResource,
	setProjectResourcePath,
} from './resources/_resource';

import * as EntryPointUtils from './utils/entry-point';
import * as FileUtils from './utils/file';
import * as PathUtils from './utils/path';
import * as SerialPortUtils from './utils/serial-port';
import * as SysItemUtils from './utils/sys-item';
import * as TerminalUtils from './utils/terminal';
import * as VscUtils from './utils/vsc';

import { InitEsp32pmProj } from './project/init_esp32pm_proj';
import { UninitEsp32pmProj } from './project/uninit_esp32pm_proj';

import { ProjectAssets } from './project/assets';

import { Supported } from './extension/support';
import { ExtensionPaths } from './extension/paths';

export function activate(context: vscode.ExtensionContext) {

	// Check if the OS is supported.
	{
		const isSupported: boolean = Supported.OSs.some((os) => {
			return (process.platform === os);
		});
		if (!isSupported) {
			vscode.window.showErrorMessage('The "ESP32-PM" extension does not support this OS.');
			return;
		}
	}

	context.subscriptions.push(vscode.commands.registerCommand('esp32-pm.create-project', async () => {
		try {
			// Ask the user for the new project location.
			const newProjectLocation: string = await VscUtils.pickFolder(
				'Select new project location.',
				'Project location not selected.',
			);

			// Ask the user for the new project name.
			const newProjectName: string = (await VscUtils.introduceString(
				'Introduce a name to be assigned to the new project.',
				'Project name not introduced.',
			)).trim().replace(/ (?= )/gi, '').replace(/ /gi, '_').toLowerCase();

			// Set the new project path.
			const newProjectPath: string = PathUtils.joinPaths(newProjectLocation, newProjectName);

			// Ask the user if the new project should be launched in the current window or in a new one.
			const windowAction: string = await VscUtils.pickElement(
				['Open in new window', 'Open in current window'],
				'Select the window to be used with the new project.',
				'Process cancelled.',
			);

			// Copy the project template.
			await SysItemUtils.copyElement(
				context.asAbsolutePath(ExtensionPaths.ProjectTemplate),
				newProjectPath,
			);

			// Set the project name in the project Makefile
			await FileUtils.replaceInFile(
				PathUtils.joinPaths(newProjectPath, ProjectAssets.ProjMakeFile),
				RegExp(':PROJECT_NAME:', 'gi'),
				newProjectName,
			);

			// Launch the new project according to the user election.
			await vscode.commands.executeCommand("vscode.openFolder", vscode.Uri.file(newProjectPath), windowAction.includes("new"));
		} catch (error) {
			// Show error message.
			vscode.window.showErrorMessage(error.message);
		}
	}));

	context.subscriptions.push(vscode.commands.registerCommand('esp32-pm.set-msys32', async () => {
		try {
			// This command is only available for Windows.
			if (process.platform !== 'win32') {
				throw Error('This command is only available for Windows.');
			}

			// Validate the project.
			await UninitEsp32pmProj.validate();

			// Set the 'msys32' folder to be used with the project.
			await setProjectResourcePath(context, ProjectResource.MSYS32_PATH);
		} catch (error) {
			// Show error message.
			vscode.window.showErrorMessage(error.message);
		}
	}));

	context.subscriptions.push(vscode.commands.registerCommand('esp32-pm.set-xtensa', async () => {
		try {
			// This command is only available for Linux.
			if (process.platform !== 'linux') {
				throw Error('This command is only available for Linux.');
			}

			// Validate the project.
			await UninitEsp32pmProj.validate();

			// Set the 'xtensa-esp32-elf' folder to be used with the project.
			await setProjectResourcePath(context, ProjectResource.XTENSA_PATH);
		} catch (error) {
			// Show error message.
			vscode.window.showErrorMessage(error.message);
		}
	}));

	context.subscriptions.push(vscode.commands.registerCommand('esp32-pm.set-idf', async () => {
		try {
			// Validate the project.
			await UninitEsp32pmProj.validate();

			// Set the ESP-IDF API folder to be used with the project.
			await setProjectResourcePath(context, ProjectResource.IDF_PATH);
		} catch (error) {
			// Show error message.
			vscode.window.showErrorMessage(error.message);
		}
	}));

	context.subscriptions.push(vscode.commands.registerCommand('esp32-pm.defconfig', async () => {
		try {
			// Validate the project.
			await InitEsp32pmProj.validate();

			// Execute the shell commands related to the 'make defconfig' command.
			TerminalUtils.executeShellCommands(
				"Defconfig",
				[
					'echo -e "ESP32-PM: Applying default config values...\n"',
					'make defconfig',
				]
			);
		} catch (error) {
			// Show error message.
			vscode.window.showErrorMessage(error.message);
		}
	}));

	context.subscriptions.push(vscode.commands.registerCommand('esp32-pm.menuconfig', async () => {
		try {
			// Validate the project.
			await InitEsp32pmProj.validate();

			// Get the project path.
			const projectPath: string = VscUtils.getWorkspacePath();

			// Set commands to launch terminal in a new window.
			var commands: Array<string> = [];
			if (process.platform === 'win32') {
				// Read the 'c_cpp_properties.json' file.
				let configContent = JSON.parse(
					(await SysItemUtils.fileExists(PathUtils.joinPaths(projectPath, ProjectAssets.VscCCppPropsFile)))
						? (await FileUtils.readFile(PathUtils.joinPaths(projectPath, ProjectAssets.VscCCppPropsFile)))
						: ExtensionPaths.VscCCppPropsFile
				);

				commands = [
					'set CHERE_INVOKING=1',
					'start ' + configContent['env']['MSYS32_PATH'] + '/mingw32.exe make menuconfig',
				];
			} else if (process.platform === 'linux') {
				commands = [
					'command -v gnome-terminal >/dev/null 2>&1 || { apt install gnome-terminal; }',
					'gnome-terminal -- make menuconfig',
				];
			}

			// Execute the shell commands related to the 'make menuconfig' command.
			TerminalUtils.executeShellCommands(
				"Menuconfig",
				[
					'echo -e "ESP32-PM: Launching graphical config menu...\n"',
					...commands
				]
			);
		} catch (error) {
			// Show error message.
			vscode.window.showErrorMessage(error.message);
		}
	}));

	context.subscriptions.push(vscode.commands.registerCommand('esp32-pm.build', async () => {
		try {
			// Validate the project.
			await InitEsp32pmProj.validate();

			// Get the project path.
			const projectPath: string = VscUtils.getWorkspacePath();

			// Get active file path.
			const activeFileAbsolutePath: string = VscUtils.getActiveFile();


			// Check if the active file is contained in a sub-project.
			if (!activeFileAbsolutePath.includes(ProjectAssets.SubProjectsFolderName)) {
				throw Error('The active file is not contained in the sub-projects folder.');
			}

			// Get entry point path.
			const entryPointRelativePath: string = activeFileAbsolutePath.substring(activeFileAbsolutePath.indexOf(ProjectAssets.SubProjectsFolderName) + ProjectAssets.SubProjectsFolderName.length + 1);

			// Check if the entry point has any of the acceptable file extensions.
			EntryPointUtils.validateEntryPoint(entryPointRelativePath);

			// Construct the main entry point file content.
			const mainFileContent: Array<string> = [
				'#include "' + PathUtils.joinPaths(ProjectAssets.SubProjectsFolderName, entryPointRelativePath) + '"',
				'extern "C"',
				'{',
				'\tvoid app_main();',
				'}'
			];

			// Write the final content to the main entry point file.
			await vscode.workspace.fs.writeFile(
				vscode.Uri.file(PathUtils.joinPaths(projectPath, 'main/main.cpp')),
				Buffer.from(mainFileContent.join('\n'))
			);

			// Construct the final main pseudo-component make file.
			const mainComponentFileContent: Array<string> = [
				'include $(PROJECT_PATH)/' + PathUtils.joinPaths(ProjectAssets.SubProjectsFolder, entryPointRelativePath.substring(0, entryPointRelativePath.indexOf('/')), 'component.mk'),
			];

			// Write the final content to the main pseudo-component make file.
			await vscode.workspace.fs.writeFile(
				vscode.Uri.file(PathUtils.joinPaths(projectPath, 'main/component.mk')),
				Buffer.from(mainComponentFileContent.join('\n'))
			);

			// Execute the shell commands related to the 'make all' command.
			TerminalUtils.executeShellCommands(
				"Build",
				[
					'echo -e "ESP32-PM: Building sub-project...\n"',
					'make -j all',
				]
			);
		} catch (error) {
			// Show error message.
			vscode.window.showErrorMessage(error.message);
		}
	}));

	vscode.commands.registerCommand('esp32-pm.serial-action', async (serialActionType: SerialAction) => {
		try {
			// Validate the project.
			await InitEsp32pmProj.validate();

			// Ask the user to select a serial port for the serial action.
			const selectedSerialPort: string = await VscUtils.pickElement(
				await SerialPortUtils.getSerialPorts(context),
				'Serial port to be used.',
				'No serial port selected.'
			);

			// Execute the shell commands related to the serial action.
			TerminalUtils.executeShellCommands(
				(serialActionType === SerialAction.Flash ? 'Flash' :
					(serialActionType === SerialAction.Monitor ? 'Monitor' :
						'Flash & Monitor')),
				[
					'echo -e "ESP32-PM: ' +
					(serialActionType === SerialAction.Flash ? 'Flashing' :
						(serialActionType === SerialAction.Monitor ? 'Monitoring' :
							'Flashing and monitoring')) +
					' project...\n"',
					'make ' +
					(serialActionType === SerialAction.Flash ? 'flash' :
						(serialActionType === SerialAction.Monitor ? 'monitor' :
							'flash monitor')) +
					' ESPPORT=' + selectedSerialPort,
				]
			);
		} catch (error) {
			// Show error message.
			vscode.window.showErrorMessage(error.message);
		}
	});

	context.subscriptions.push(vscode.commands.registerCommand('esp32-pm.flash', async () => {
		// Execute the 'make flash' command by using its serial action.
		await vscode.commands.executeCommand('esp32-pm.serial-action', SerialAction.Flash);
	}));

	context.subscriptions.push(vscode.commands.registerCommand('esp32-pm.monitor', async () => {
		// Execute the 'make monitor' command by using its serial action.
		await vscode.commands.executeCommand('esp32-pm.serial-action', SerialAction.Monitor);
	}));

	context.subscriptions.push(vscode.commands.registerCommand('esp32-pm.flash-monitor', async () => {
		// Execute the 'make flash monitor' command by using its serial action.
		await vscode.commands.executeCommand('esp32-pm.serial-action', SerialAction.FlashAndMonitor);
	}));
}

export function deactivate() { }
