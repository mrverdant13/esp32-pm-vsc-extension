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

import * as Esp32PmProjectConsts from "./constants/esp32pm-project";
import * as ExtensionConsts from './constants/extension-const';
import {
	Project,
	ProjectValidationType,
	ProjectResourceType,
} from './models/esp32pm-project';
import * as utils from './utils';
import * as joiner from './joiner';

export function activate(context: vscode.ExtensionContext) {

	// Check if the OS is supported.
	{
		const isSupported: boolean = ExtensionConsts.SupportedOSs.some((os) => {
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
			const newProjectLocation: string = await utils.pickFolder(
				'Select new project location.',
				'Project location not selected.',
			);

			// Ask the user for the new project name.
			const newProjectName: string = (await utils.introduceString(
				'Introduce a name to be assigned to the new project.',
				'Project name not introduced.',
			)).trim().replace(/ (?= )/gi, '').replace(/ /gi, '_').toLowerCase();

			// Set the new project path.
			const newProjectPath: string = joiner.joinPaths(newProjectLocation, newProjectName);

			// Ask the user if the new project should be launched in the current window or in a new one.
			const windowAction: string = await utils.pickElement(
				['Open in new window', 'Open in current window'],
				'Select the window to be used with the new project.',
				'Process cancelled.',
			);

			// Copy the project template.
			await utils.copyElement(
				context.asAbsolutePath(ExtensionConsts.Paths.ProjectTemplate),
				newProjectPath,
			);

			// Set the project name in the project Makefile
			await utils.replaceInFile(
				joiner.joinPaths(newProjectPath, 'Makefile'),
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

			// Validate Espressif project.
			await Project.validateProject(ProjectValidationType.ESPRESSIF_PROJ);

			// Set the 'msys32' folder to be used with the project.
			await Project.setProjectResourcePath(context, ProjectResourceType.MSYS32_PATH);
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

			// Validate Espressif project.
			await Project.validateProject(ProjectValidationType.ESPRESSIF_PROJ);

			// Set the 'xtensa-esp32-elf' folder to be used with the project.
			await Project.setProjectResourcePath(context, ProjectResourceType.XTENSA_PATH);
		} catch (error) {
			// Show error message.
			vscode.window.showErrorMessage(error.message);
		}
	}));

	context.subscriptions.push(vscode.commands.registerCommand('esp32-pm.set-idf', async () => {
		try {
			// Validate Espressif project.
			await Project.validateProject(ProjectValidationType.ESPRESSIF_PROJ);

			// Set the ESP-IDF API folder to be used with the project.
			await Project.setProjectResourcePath(context, ProjectResourceType.IDF_PATH);
		} catch (error) {
			// Show error message.
			vscode.window.showErrorMessage(error.message);
		}
	}));

	context.subscriptions.push(vscode.commands.registerCommand('esp32-pm.defconfig', async () => {
		try {
			// Validate Espressif project.
			await Project.validateProject(ProjectValidationType.ESP32PM_PROJ);

			// Execute the shell commands related to the 'make defconfing' command.
			utils.executeShellCommands(
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
			// Get ESP32-PM project path.
			const projectPath: string = await Project.getWorkspacePath(ProjectValidationType.ESPRESSIF_PROJ);

			// Set commands to launch terminal in a new window.
			var commands: Array<string> = [];
			if (process.platform === 'win32') {
				// Read the 'c_cpp_properties.json' file.
				let configContent = JSON.parse(
					(await utils.fileExists(joiner.joinPaths(projectPath, Esp32PmProjectConsts.Paths.VscCCppPropsFile)))
						? (await utils.readFile(joiner.joinPaths(projectPath, Esp32PmProjectConsts.Paths.VscCCppPropsFile)))
						: ExtensionConsts.Paths.VscCCppPropsFile
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
			utils.executeShellCommands(
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
			// Get ESP32-PM project path.
			const projectPath: string = await Project.getWorkspacePath(ProjectValidationType.ESPRESSIF_PROJ);

			// Get active file path.
			const activeFileAbsolutePath: string = utils.getActiveFile();

			// Check if the active file is contained in a subproject.
			if (!activeFileAbsolutePath.includes(Esp32PmProjectConsts.SubprojectsFolderName)) {
				throw Error('The active file is not contained in the sub-projects folder.');
			}

			// Get entry point path.
			const entryPointRelativePath: string = activeFileAbsolutePath.substring(activeFileAbsolutePath.indexOf(Esp32PmProjectConsts.SubprojectsFolderName) + Esp32PmProjectConsts.SubprojectsFolderName.length + 1);

			// Check if the entry point has any of the acceptable file extensions.
			const isEntryPointCandidate: boolean = Esp32PmProjectConsts.EntryPoint.Extensions.some((extension) => {
				return entryPointRelativePath.endsWith(extension);
			});
			if (!isEntryPointCandidate) {
				throw Error('The active file is not a C/C++ file.');
			}

			// Construct the main entry point file content.
			const mainFileContent: Array<string> = [
				'#include "' + joiner.joinPaths(Esp32PmProjectConsts.SubprojectsFolderName, entryPointRelativePath) + '"',
				'extern "C"',
				'{',
				'\tvoid app_main();',
				'}'
			];

			// Write the final content to the main entry point file.
			await vscode.workspace.fs.writeFile(
				vscode.Uri.file(joiner.joinPaths(projectPath, 'main/main.cpp')),
				Buffer.from(mainFileContent.join('\n'))
			);

			// Construct the final main pseudo-component make file.
			const mainComponentFileContent: Array<string> = [
				'include $(PROJECT_PATH)/' + joiner.joinPaths(Esp32PmProjectConsts.Paths.SubprojectsFolder, entryPointRelativePath.substring(0, entryPointRelativePath.indexOf('/')), 'component.mk'),
			];

			// Write the final content to the main pseudo-component make file.
			await vscode.workspace.fs.writeFile(
				vscode.Uri.file(joiner.joinPaths(projectPath, 'main/component.mk')),
				Buffer.from(mainComponentFileContent.join('\n'))
			);

			// Execute the shell commands related to the 'make all' command.
			utils.executeShellCommands(
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

	vscode.commands.registerCommand('esp32-pm.serial-action', async (serialActionType: ExtensionConsts.SerialActionType) => {
		try {
			// Validate ESP32-PM project.
			await Project.validateProject(ProjectValidationType.ESP32PM_PROJ);

			// Ask the user to select a serial port for the serial action.
			const selectedSerialPort: string = await utils.pickElement(
				await utils.getSerialPorts(context),
				'Serial port to be used.',
				'No serial port selected.'
			);

			// Execute the shell commands related to the serial action.
			utils.executeShellCommands(
				(serialActionType === ExtensionConsts.SerialActionType.Flash ? 'Flas' :
					(serialActionType === ExtensionConsts.SerialActionType.Monitor ? 'Monitor' :
						'Flash & Monitor')),
				[
					'echo -e "ESP32-PM: ' +
					(serialActionType === ExtensionConsts.SerialActionType.Flash ? 'Flashing' :
						(serialActionType === ExtensionConsts.SerialActionType.Monitor ? 'Monitoring' :
							'Flashing and monitoring')) +
					' project...\n"',
					'make ' +
					(serialActionType === ExtensionConsts.SerialActionType.Flash ? 'flash' :
						(serialActionType === ExtensionConsts.SerialActionType.Monitor ? 'monitor' :
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
		await vscode.commands.executeCommand('esp32-pm.serial-action', ExtensionConsts.SerialActionType.Flash);
	}));

	context.subscriptions.push(vscode.commands.registerCommand('esp32-pm.monitor', async () => {
		// Execute the 'make monitor' command by using its serial action.
		await vscode.commands.executeCommand('esp32-pm.serial-action', ExtensionConsts.SerialActionType.Monitor);
	}));

	context.subscriptions.push(vscode.commands.registerCommand('esp32-pm.flash-monitor', async () => {
		// Execute the 'make flash monitor' command by using its serial action.
		await vscode.commands.executeCommand('esp32-pm.serial-action', ExtensionConsts.SerialActionType.FlashAndMonitor);
	}));
}

export function deactivate() { }
