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

import {
	join,
} from 'path';

import * as vscode from 'vscode';

import {
	subprojectsFolder,
	entryPointPrefix,
	entryPointExtensions,
	supportedOSs,
	overwritingSuffix,
	overwritingFiles,
	boundedProjectName,
	menuconfigBashPath,
	projectTemplatePath,
	boundedConstant,
} from './constants';
import {
	getWorkspacePath,
	validateEsp32PmProject,
	validateEspressifProject,
	ValidationType,
} from './esp32-pm-project';
import {
	ValuesManager,
	ValueType,
	Values,
} from './values-manager';
import * as utils from './utils';

export function activate(context: vscode.ExtensionContext) {

	// Check if the OS is supported.
	{
		const isSupported: boolean = supportedOSs.some((os) => {
			return (process.platform === os);
		});
		if (!isSupported) {
			vscode.window.showErrorMessage('The "ESP32-PM" extension does not support this OS.');
			return;
		}
	}

	context.subscriptions.push(vscode.commands.registerCommand('esp32-pm.register-espressif-toolchain', async () => {
		try {
			// Register an Espressif Toolchain folder path.
			await ValuesManager.registerValue(context, ValueType.TOOLCHAIN_PATH);
		} catch (error) {
			// Show error message.
			vscode.window.showErrorMessage(error.message);
		}
	}));

	context.subscriptions.push(vscode.commands.registerCommand('esp32-pm.register-esp-idf', async () => {
		try {
			// Register an ESP-IDF API folder path.
			await ValuesManager.registerValue(context, ValueType.IDF_PATH);
		} catch (error) {
			// Show error message.
			vscode.window.showErrorMessage(error.message);
		}
	}));

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
			const newProjectPath: string = join(newProjectLocation, newProjectName);

			// Ask the user which Espressif Toolchain and ESP-IDF API are going to be used with the project.
			const paths: Values = await ValuesManager.getValues(context);
			const toolchainPath: string = await utils.pickElement(
				paths.toolchainPaths,
				'Select an Espressif Toolchain to be used with the project.',
				'Espressif Toolchain not selected.',
			);
			const idfPath: string = await utils.pickElement(
				paths.idfPaths,
				'Select an ESP-IDF API to be used with the project.',
				'ESP-IDF API not selected.',
			);

			// Ask the user if the new project should be launched in the current window or in a new one.
			const windowAction: string = await utils.pickElement(
				['Open in new window', 'Open in current window'],
				'Select the window to be used with the new project.',
				'Process cancelled.',
			);

			// Copy the project template.
			await utils.copyFile(
				context.asAbsolutePath(projectTemplatePath),
				newProjectPath,
			);

			// Set the project name in the Makefile
			await utils.replaceInFile(
				join(newProjectPath, 'Makefile'),
				RegExp(boundedConstant(boundedProjectName), 'gi'),
				newProjectName,
			);

			// Use the selected MinGW32 terminal and ESP-IDF API
			await ValuesManager.setConfiguration(context, toolchainPath, idfPath, newProjectPath);

			// Launch the new project according to the user election.
			await vscode.commands.executeCommand("vscode.openFolder", vscode.Uri.file(newProjectPath), windowAction.includes("new"));
		} catch (error) {
			// Show error message.
			vscode.window.showErrorMessage(error.message);
		}
	}));

	context.subscriptions.push(vscode.commands.registerCommand('esp32-pm.init-project', async () => {
		try {
			// Ask the user for an existing project location.
			const existingProjectPath: string = await utils.pickFolder(
				'Select existing project location.',
				'Existing project location not selected.',
			);

			// Validate if the project is an Espressif one.
			await validateEspressifProject(existingProjectPath);

			// Warn the user about files renaming.
			if (undefined === await vscode.window.showWarningMessage("The '" + overwritingSuffix + "' sufix will be used for the folloging files if they exist: '" + overwritingFiles.join("', '") + "'.", "Continue")) {
				return;
			}

			// Ask the user which Espressif Toolchain and ESP-IDF API are going to be used with the project.
			const paths: Values = await ValuesManager.getValues(context);
			const toolchainPath = await utils.pickElement(
				paths.toolchainPaths,
				'Select an Espressif Toolchain to be used with the project.',
				'Espressif Toolchain not selected.',
			);
			const idfPath = await utils.pickElement(
				paths.idfPaths,
				'Select an ESP-IDF API to be used with the project.',
				'ESP-IDF API not selected.',
			);

			// Ask the user if the existing project should be launched in the current window or in a new one.
			const windowAction = await utils.pickElement(
				["Open in new window", "Open in current window"],
				'Select the window to be used with the new project.',
				'Process cancelled.',
			);

			// Apply sufix.
			for (let index = 0; index < overwritingFiles.length; index++) {
				const filePath: string = join(existingProjectPath, overwritingFiles[index]);
				if (await utils.fileExists(filePath)) {
					await vscode.workspace.fs.rename(vscode.Uri.file(filePath), vscode.Uri.file(filePath + overwritingSuffix), { overwrite: true });
				}
			}

			// Copy the sub-project examples if the sub-projects folder does not exist.
			if (!await utils.folderExists(join(existingProjectPath, subprojectsFolder))) {
				await vscode.workspace.fs.copy(
					vscode.Uri.file(context.asAbsolutePath(projectTemplatePath + subprojectsFolder)),
					vscode.Uri.file(join(existingProjectPath, subprojectsFolder)),
					{ overwrite: false }
				);
			}

			// Use the selected MinGW32 terminal and ESP-IDF API
			await ValuesManager.setConfiguration(context, toolchainPath, idfPath, existingProjectPath);

			// Launch the new project according to the user election.
			await vscode.commands.executeCommand("vscode.openFolder", vscode.Uri.file(existingProjectPath), windowAction.includes("new"));
		} catch (error) {
			// Show error message.
			vscode.window.showErrorMessage(error.message);
		}
	}));

	context.subscriptions.push(vscode.commands.registerCommand('esp32-pm.menuconfig', async () => {
		try {
			// Validate the current project.
			await validateEsp32PmProject();

			// Execute the 'make menuconfig' command.
			utils.executeShellCommands(
				"Menuconfig",
				[
					'sh ' + menuconfigBashPath
				]
			);
		} catch (error) {
			// Show error message.
			vscode.window.showErrorMessage(error.message);
		}
	}));

	context.subscriptions.push(vscode.commands.registerCommand('esp32-pm.defconfig', async () => {
		try {
			// Validate the current project.
			await validateEsp32PmProject();

			// Execute the 'make defconfing' command.
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

	context.subscriptions.push(vscode.commands.registerCommand('esp32-pm.build-subproject', async () => {
		try {
			// Get the project path.
			const currentProjectPath: string = await getWorkspacePath(ValidationType.ESP32_PM_PROJ);

			// Ask the user for a sub-project to build.
			const selectedSubprojectFolder = await utils.pickElement(
				utils.getFolders(join(currentProjectPath, subprojectsFolder)),
				'Select a sub-project to be built',
				'Sub-project not selected.',
			);

			// Get an array of entry point candidates to be built.
			// The candidates are defined by specific prefix and extensions.
			var entryPoints: Array<string> = [];
			utils.getFiles(join(currentProjectPath, subprojectsFolder, selectedSubprojectFolder)).forEach((file) => {
				if (!file.startsWith(entryPointPrefix)) {
					return;
				}
				entryPointExtensions.forEach((suffix) => {
					if (file.endsWith(suffix)) {
						entryPoints.push(file);
					}
				});
			});

			var entryPoint: string;
			// If there is not entry point, notify the user.
			if (entryPoints.length === 0) {
				vscode.window.showErrorMessage('There is no entry point for the selected sub-project.');
				return;
			}
			// Else, if there is only one entry point, use it.
			else if (entryPoints.length === 1) {
				entryPoint = entryPoints[0];
			}
			// Else, ask the user which entry point will be used.
			else {
				entryPoint = await utils.pickElement(
					entryPoints,
					'Choose an entry point for the selected sub-project.',
					'No entry point selected.'
				);
			}

			// Construct the final main file content.
			const mainFileContent: Array<string> = [
				'#include "src/' + selectedSubprojectFolder + '/' + entryPoint + '"',
				'extern "C"',
				'{',
				'\tvoid app_main();',
				'}'
			];

			// Write the final content to the main file.
			await vscode.workspace.fs.writeFile(
				vscode.Uri.file(join(currentProjectPath, 'main/main.cpp')),
				Buffer.from(mainFileContent.join('\n'))
			);

			// Construct the final main pseudo-component make file.
			const mainComponentFileContent: Array<string> = [
				'include $(PROJECT_PATH)/' + subprojectsFolder + selectedSubprojectFolder + '/component.mk',
			];

			// Write the final content to the main component make file.
			await vscode.workspace.fs.writeFile(
				vscode.Uri.file(join(currentProjectPath, 'main/component.mk')),
				Buffer.from(mainComponentFileContent.join('\n'))
			);

			// Execute the shell commands related to the make all command using the selected sub-project and entry point.
			utils.executeShellCommands(
				'Build sub-project',
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

	async function getSerialPorts(): Promise<Array<string>> {
		const currentProjectPath: string = await getWorkspacePath(ValidationType.ESP32_PM_PROJ);

		const comPortsFile: string = "comPortsFile";

		// Execute the Windows commands to list the available COM ports.
		utils.executeShellCommands(
			'Generate serial ports',
			[
				'echo -e "ESP32-PM: Generating serial ports list...\n"',
				'export comPortsFile="' + comPortsFile + '"',
				'sh ' + context.extensionPath.replace(/\\/gi, '/') + '/assets/scripts/GenerateComList.sh',
			]
		);

		// Create a watcher for the serial ports file deletion.
		const fsw: vscode.FileSystemWatcher = vscode.workspace.createFileSystemWatcher('**/build/' + comPortsFile, true, true, false);
		var serialPorts: Array<string> = [];
		var serialPortsChecked: boolean = false;

		// When the serial ports file is deleted, get the found serial ports.
		fsw.onDidDelete(
			async () => {
				const fileContent = (await vscode.workspace.fs.readFile(vscode.Uri.file(currentProjectPath + "/build/" + comPortsFile + ".txt"))).toString().trim();
				if (fileContent.length > 0) {
					serialPorts = fileContent.split("\n");
				}
				serialPortsChecked = true;
			}
		);

		// Wait until all serial ports are checked.
		while (!serialPortsChecked) {
			await utils.delay(100);
		}

		// Delete the watcher.
		fsw.dispose();

		// If there is no available serial port, throw error.
		if (serialPorts.length === 0) {
			throw Error('No serial port available.');
		}

		// Return the found serial ports.
		return serialPorts;
	}

	context.subscriptions.push(vscode.commands.registerCommand('esp32-pm.flash', async (executeMonitor: boolean = false) => {
		try {
			// Validate the current project.
			await validateEsp32PmProject();

			// Get the available serial ports.
			const serialPorts: Array<string> = await getSerialPorts();

			// Ask the user which serial port will be used.
			const selectedSerialPort = await utils.pickElement(
				serialPorts,
				'Serial port to be used',
				'No serial port selected.'
			);

			// Execute the shell commands related to the make flash or make flash monitor command using the selected serial port.
			utils.executeShellCommands(
				'Flash' + (executeMonitor ? ' & Monitor' : ''),
				[
					'echo -e "ESP32-PM: Flashing project' + (executeMonitor ? ' and opening serial port' : '') + '...\n"',
					'make flash' + (executeMonitor ? ' monitor' : '') + ' ESPPORT=' + selectedSerialPort,
				]
			);
		} catch (error) {
			// Show error message.
			vscode.window.showErrorMessage(error.message);
		}
	}));

	context.subscriptions.push(vscode.commands.registerCommand('esp32-pm.monitor', async () => {
		try {
			// Validate the current project.
			await validateEsp32PmProject();

			// Get the available serial ports.
			const serialPorts: Array<string> = await getSerialPorts();

			// Ask the user which serial port will be used.
			const selectedSerialPort = await utils.pickElement(
				serialPorts,
				'Serial port to be used',
				'No serial port selected.'
			);

			// Execute the shell commands related to the make monitor command using the selected serial port.
			utils.executeShellCommands(
				'Monitor',
				[
					'echo -e "ESP32-PM: Opening serial port...\n"',
					'make monitor ESPPORT=' + selectedSerialPort,
				]
			);
		} catch (error) {
			// Show error message.
			vscode.window.showErrorMessage(error.message);
		}
	}));

	context.subscriptions.push(vscode.commands.registerCommand('esp32-pm.clean', async () => {
		try {
			// Validate the current project.
			await validateEsp32PmProject();

			// Execute the shell commands related to the make clean command.
			utils.executeShellCommands(
				'Clean',
				[
					'echo -e "ESP32-PM: Deleting build output files...\n"',
					'make clean',
					'echo -e "\nESP32-PM: Build output files deleted.\n"',
				]
			);
		} catch (error) {
			// Show error message.
			vscode.window.showErrorMessage(error.message);
		}
	}));

	context.subscriptions.push(vscode.commands.registerCommand('esp32-pm.flash-monitor', async () => {
		try {
			// Execute the make flash command including the monitor target.
			await vscode.commands.executeCommand('esp32-pm.flash', true);
		} catch (error) {
			// Show error message.
			vscode.window.showErrorMessage(error.message);
		}
	}));

	context.subscriptions.push(vscode.commands.registerCommand('esp32-pm.remove-auto-gen', async () => {
		try {
			// Execute this command only if the project is an ESP32-PM one.
			const currentProjectPath: string = await getWorkspacePath(ValidationType.ESP32_PM_PROJ);

			// Remove auto-generated files.
			vscode.workspace.fs.delete(vscode.Uri.file(join(currentProjectPath, "main/main.c")));
			vscode.workspace.fs.delete(vscode.Uri.file(join(currentProjectPath, "main/main.cpp")));
			vscode.workspace.fs.delete(vscode.Uri.file(join(currentProjectPath, "sdkconfig")));
			vscode.workspace.fs.delete(vscode.Uri.file(join(currentProjectPath, "sdkconfig.old")));
			vscode.workspace.fs.delete(vscode.Uri.file(join(currentProjectPath, "build")));
		} catch (error) {
			// Show error message.
			vscode.window.showErrorMessage(error.message);
		}
	}));

}

export function deactivate() { }
