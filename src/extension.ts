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
	join
} from 'path';

import * as vscode from 'vscode';

import {
	subprojectsFolder,
	entryPointPrefix,
	entryPointExtensions,
	supportedOSs,
	overwritingSuffix,
	overwritingFiles,
	colonProjectName,
	menuconfigBashPath
} from './constants';
import {
	isEspressifProject,
	isEsp32PmProject
} from './esp32project';
import {
	PathsManager,
	PathType,
	Paths
} from './paths';
import * as utils from './utils';

export function activate(context: vscode.ExtensionContext) {

	// Check if the OS is supported.
	const isSupported: boolean = supportedOSs.some((os) => {
		return (process.platform === os);
	});
	if (!isSupported) {
		vscode.window.showErrorMessage('The "ESP32-PM" extension does not support this OS.');
		return;
	}

	context.subscriptions.push(vscode.commands.registerCommand('esp32-pm.register-espressif-toolchain', async () => {
		// Register an Espressif Toolchain folder path.
		PathsManager.registerPath(context, PathType.TOOLCHAIN);
	}));

	context.subscriptions.push(vscode.commands.registerCommand('esp32-pm.register-esp-idf', async () => {
		// Register an ESP-IDF API folder path.
		PathsManager.registerPath(context, PathType.IDF);
	}));

	context.subscriptions.push(vscode.commands.registerCommand('esp32-pm.create-project', async () => {

		// Ask the user for the new project location.
		const projectLocation = await vscode.window.showOpenDialog({
			canSelectFiles: false,
			canSelectFolders: true,
			canSelectMany: false,
			openLabel: "Select project location"
		});
		if (projectLocation === undefined) {
			vscode.window.showErrorMessage("Project location not selected.");
			return;
		}

		// Ask the user for the new project name.
		var introducedName: string | undefined = await vscode.window.showInputBox({ prompt: "Name of the new project" });
		if (introducedName === undefined || introducedName.trim().length === 0) {
			vscode.window.showErrorMessage("Project name not introduced");
			return;
		}
		introducedName = introducedName.trim().replace(/ (?= )/gi, '').replace(/ /gi, '_').toLowerCase();

		// Ask the user which Espressif Toolchain and ESP-IDF API are going to be used with the project.
		const paths: Paths = await PathsManager.getValues(context);
		const toolchainPath = await utils.showQuickPickFrom(paths.toolchainPaths, "Esfressif Toolchain to be used");
		if (toolchainPath === undefined) {
			vscode.window.showErrorMessage("Espressif Toolchain not selected.");
			return;
		}
		const idfPath = await utils.showQuickPickFrom(paths.idfPaths, "ESP-IDF API to be used");
		if (idfPath === undefined) {
			vscode.window.showErrorMessage("ESP-IDF API not selected.");
			return;
		}

		// Ask the user if the new project should be launched in the current window or in a new one.
		const useNewWindow = await utils.showQuickPickFrom(["Open in new window", "Open in current window"], "");
		if (!useNewWindow) {
			vscode.window.showErrorMessage("Project creation cancelled");
			return;
		}

		// Set the new project path.
		const projectPath: string = join(projectLocation[0].fsPath, introducedName);

		// Copy the project template.
		await vscode.workspace.fs.copy(
			vscode.Uri.file(context.asAbsolutePath('/assets/projectTemplate')),
			vscode.Uri.file(projectPath),
			{ overwrite: false }
		);

		// Set the project name in the Makefile
		const makefileContent: string = (await vscode.workspace.fs.readFile(vscode.Uri.file(join(projectPath, 'Makefile')))).toString();
		await vscode.workspace.fs.writeFile(
			vscode.Uri.file(join(projectPath, 'Makefile')),
			Buffer.from(makefileContent.replace(RegExp(':' + colonProjectName + ':', 'gi'), introducedName))
		);

		// Use the selected MinGW32 terminal and ESP-IDF API
		await PathsManager.setConfiguration(context, toolchainPath, idfPath, projectPath);

		// Launch the new project according to the user election.
		await vscode.commands.executeCommand("vscode.openFolder", vscode.Uri.file(projectPath), useNewWindow.includes("new"));
	}));

	context.subscriptions.push(vscode.commands.registerCommand('esp32-pm.init-project', async () => {

		// Ask the user for an existing project location.
		var projectLocation = await vscode.window.showOpenDialog({
			canSelectFiles: false,
			canSelectFolders: true,
			canSelectMany: false,
			openLabel: "Select existing project location"
		});
		if (projectLocation === undefined) {
			vscode.window.showErrorMessage("Existing project location not selected.");
			return;
		}

		// Set the existing project path.
		var projectPath: string = join(projectLocation[0].fsPath);

		// Check if the project is an Espressif one.
		if (!await isEspressifProject()) {
			vscode.window.showErrorMessage("The selected folder does not contain an Espressif project.");
			return;
		}

		// Warn the user about files renaming.
		if (undefined === await vscode.window.showWarningMessage("The " + overwritingSuffix + " sufix will be used for the folloging files if they exist: '" + overwritingFiles.join("', '") + "'.", "Continue")) {
			return;
		}

		// Ask the user which MinGW32 terminal and ESP-IDF API are going to be used with the project.
		const paths: Paths = await PathsManager.getValues(context);
		var toolchainPath = await utils.showQuickPickFrom(paths.toolchainPaths, "MinGW32 terminal to be used");
		if (toolchainPath === undefined) {
			vscode.window.showErrorMessage("MinGW32 terminal not selected.");
			return;
		}
		var idfPath = await utils.showQuickPickFrom(paths.idfPaths, "ESP-IDF API to be used");
		if (idfPath === undefined) {
			vscode.window.showErrorMessage("ESP-IDF API not selected.");
			return;
		}

		// Ask the user if the existing project should be launched in the current window or in a new one.
		var useNewWindow = await utils.showQuickPickFrom(
			[
				"Open in new window",
				"Open in current window",
			], "");
		if (!useNewWindow) {
			vscode.window.showErrorMessage("Project initialization cancelled");
			return;
		}

		// Apply sufix.
		for (let index = 0; index < overwritingFiles.length; index++) {
			const filePath: string = join(projectPath, overwritingFiles[index]);
			if (await utils.fileExists(filePath)) {
				await vscode.workspace.fs.rename(vscode.Uri.file(filePath), vscode.Uri.file(filePath + overwritingSuffix), { overwrite: true });
			}
		}

		// Copy the sub-project examples if the sub-projects folder does not exist.
		if (!await utils.folderExists(join(projectPath, subprojectsFolder))) {
			await vscode.workspace.fs.copy(
				vscode.Uri.file(context.asAbsolutePath('/assets/projectTemplate/main/src')),
				vscode.Uri.file(join(projectPath, subprojectsFolder)),
				{ overwrite: false }
			);
		}

		// Use the selected MinGW32 terminal and ESP-IDF API
		await PathsManager.setConfiguration(context, toolchainPath, idfPath, projectPath);

		// Launch the new project according to the user election.
		await vscode.commands.executeCommand("vscode.openFolder", vscode.Uri.file(projectPath), useNewWindow.includes("new"));
	}));

	context.subscriptions.push(vscode.commands.registerCommand('esp32-pm.defconfig', async () => {
		// Execute this command only if the project is an ESP32-PM one.
		if (!await isEsp32PmProject()) {
			vscode.window.showErrorMessage("The current workspace is not an ESP32-PM project or it has not been initialized.");
			return;
		}

		// Execute the shell commands related to the make defconfing command.
		utils.executeShellCommands(
			"Defconfig",
			[
				'echo -e "ESP32-PM: Applying default config values...\n"',
				'make defconfig',
			]
		);
	}));

	context.subscriptions.push(vscode.commands.registerCommand('esp32-pm.menuconfig', async () => {
		// Execute this command only if the project is an ESP32-PM one.
		if (!await isEsp32PmProject()) {
			vscode.window.showErrorMessage("The current workspace is not an ESP32-PM project or it has not been initialized.");
			return;
		}

		// Execute the Menuconfig bash.
		utils.executeShellCommands(
			"Menuconfig",
			[
				'sh ' + menuconfigBashPath
			]
		);
	}));

	context.subscriptions.push(vscode.commands.registerCommand('esp32-pm.build-subproject', async () => {
		// Execute this command only if the project is an ESP32-PM one.
		if (!await isEsp32PmProject()) {
			vscode.window.showErrorMessage("The current workspace is not an ESP32-PM project or it has not been initialized.");
			return;
		}

		// Check if the workspace exists.
		var workspaceFolders = vscode.workspace.workspaceFolders;
		if (!workspaceFolders) {
			return;
		}

		// Ask the user for a sub-project to build.
		var selectedSubprojectFolder = await utils.showQuickPickFrom(utils.getFolders(join(workspaceFolders[0].uri.fsPath, subprojectsFolder)), 'Sub-project to be built');
		if (!selectedSubprojectFolder) {
			vscode.window.showWarningMessage("Sub-project not selected.");
			return;
		}

		// Get an array of entry point candidates to be built.
		// The candidates are defined by specific prefix and extensions.
		var entryPoints: string[] = [];
		utils.getFiles(join(workspaceFolders[0].uri.fsPath, subprojectsFolder, selectedSubprojectFolder)).forEach((file) => {
			if (!file.startsWith(entryPointPrefix)) { return; }
			entryPointExtensions.forEach((suffix) => {
				if (file.endsWith(suffix)) { entryPoints.push(file); }
			});
		});

		var entryPoint: string | undefined;
		// If there is not entry point, notify the user.
		if (entryPoints.length === 0) {
			vscode.window.showErrorMessage("There is no entry point for the selected sub-project.");
			return;
		}
		// Else, if there is only one entry point, use it.
		else if (entryPoints.length === 1) {
			entryPoint = entryPoints[0];
		}
		// Else, ask the user which entry point will be used.
		else {
			entryPoint = await utils.showQuickPickFrom(entryPoints, "Entry point for the sub-project.");
			if (!entryPoint) {
				vscode.window.showErrorMessage("No entry point selected.");
				return;
			}
		}

		// Delete the built files regarding the main application.
		vscode.workspace.fs.delete(vscode.Uri.file(join(workspaceFolders[0].uri.fsPath, "build/main")));

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
			vscode.Uri.file(join(workspaceFolders[0].uri.fsPath, 'main/main.cpp')),
			Buffer.from(mainFileContent.join('\n'))
		);

		// Construct the final main pseudo-component make file.
		const mainComponentFileContent: Array<string> = [
			'include $(PROJECT_PATH)/' + subprojectsFolder + selectedSubprojectFolder + '/component.mk',
		];

		// Write the final content to the main component make file.
		await vscode.workspace.fs.writeFile(
			vscode.Uri.file(join(workspaceFolders[0].uri.fsPath, 'main/component.mk')),
			Buffer.from(mainComponentFileContent.join('\n'))
		);

		// Execute the shell commands related to the make all command using the selected sub-project and entry point.
		utils.executeShellCommands(
			"Build sub-project",
			[
				'echo -e "ESP32-PM: Building sub-project...\n"',
				'make -j all',
			]
		);
	}));

	async function getSerialPorts() {
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
		var fsw: vscode.FileSystemWatcher = vscode.workspace.createFileSystemWatcher('**/build/' + comPortsFile, true, true, false);
		var serialPorts: string[] = [];
		var serialPortsChecked: boolean = false;

		// When the serial ports file is deleted, get the found serial ports.
		fsw.onDidDelete(
			async () => {
				var workspaceFolders = vscode.workspace.workspaceFolders;
				if (workspaceFolders) {
					var fileContent = (await vscode.workspace.fs.readFile(vscode.Uri.file(workspaceFolders[0].uri.fsPath + "/build/" + comPortsFile + ".txt"))).toString().trim();
					if (fileContent.length > 0) {
						serialPorts = fileContent.split("\n");
					}
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

		// Return the found serial ports.
		return serialPorts;
	}

	context.subscriptions.push(vscode.commands.registerCommand('esp32-pm.flash', async () => {
		// Execute this command only if the project is an ESP32-PM one.
		if (!await isEsp32PmProject()) {
			vscode.window.showErrorMessage("The current workspace is not an ESP32-PM project or it has not been initialized.");
			return;
		}

		// Get the available serial ports.
		var serialPorts: string[] = await getSerialPorts();

		// If there is no available serial port, stop command execution.
		if (serialPorts.length === 0) {
			vscode.window.showErrorMessage('No serial port available.');
			return;
		}

		// Ask the user which serial port will be used.
		var selectedSerialPort = await utils.showQuickPickFrom(serialPorts, 'Serial port to be used');
		if (!selectedSerialPort) {
			vscode.window.showErrorMessage("No serial port selected.");
			return;
		}

		// Execute the shell commands related to the make flash command using the selected serial port.
		utils.executeShellCommands(
			'Flash',
			[
				'echo -e "ESP32-PM: Flashing project...\n"',
				'make flash ESPPORT=' + selectedSerialPort,
			]
		);
	}));

	context.subscriptions.push(vscode.commands.registerCommand('esp32-pm.monitor', async () => {
		// Execute this command only if the project is an ESP32-PM one.
		if (!await isEsp32PmProject()) {
			vscode.window.showErrorMessage("The current workspace is not an ESP32-PM project or it has not been initialized.");
			return;
		}

		// Get the available serial ports.
		var serialPorts: string[] = await getSerialPorts();

		// If there is no available serial port, stop command execution.
		if (serialPorts.length === 0) {
			vscode.window.showErrorMessage('No serial port available.');
			return;
		}

		// Ask the user which serial port will be used.
		var selectedSerialPort = await utils.showQuickPickFrom(serialPorts, 'Serial port to be used');
		if (!selectedSerialPort) {
			vscode.window.showErrorMessage("No serial port selected.");
			return;
		}

		// Execute the shell commands related to the make monitor command using the selected serial port.
		utils.executeShellCommands(
			'Monitor',
			[
				'echo -e "ESP32-PM: Opening serial port...\n"',
				'make monitor ESPPORT=' + selectedSerialPort,
			]
		);
	}));

	context.subscriptions.push(vscode.commands.registerCommand('esp32-pm.flash-monitor', async () => {
		// Execute this command only if the project is an ESP32-PM one.
		if (!await isEsp32PmProject()) {
			vscode.window.showErrorMessage("The current workspace is not an ESP32-PM project or it has not been initialized.");
			return;
		}

		// Get the available serial ports.
		var serialPorts: string[] = await getSerialPorts();

		// If there is no available serial port, stop command execution.
		if (serialPorts.length === 0) {
			vscode.window.showErrorMessage('No serial port available.');
			return;
		}

		// Ask the user which serial port will be used.
		var selectedSerialPort = await utils.showQuickPickFrom(serialPorts, 'Serial port to be used');
		if (!selectedSerialPort) {
			vscode.window.showErrorMessage("No serial port selected.");
			return;
		}

		// Execute the shell commands related to the make flash monitor command using the selected serial port.
		utils.executeShellCommands(
			'Flash & Monitor',
			[
				'echo -e "ESP32-PM: Flashing project and opening serial port...\n"',
				'make flash monitor ESPPORT=' + selectedSerialPort,
			]
		);
	}));

	context.subscriptions.push(vscode.commands.registerCommand('esp32-pm.clean', async () => {
		// Execute this command only if the project is an ESP32-PM one.
		if (!await isEsp32PmProject()) {
			vscode.window.showErrorMessage("The current workspace is not an ESP32-PM project or it has not been initialized.");
			return;
		}

		// Execute the shell commands related to the make clean command.
		utils.executeShellCommands(
			'Clean',
			[
				'echo -e "ESP32-PM: Deleting build output files...\n"',
				'make clean',
				'echo -e "\nESP32-PM: Build output files deleted.\n"',
			]
		);
	}));

	context.subscriptions.push(vscode.commands.registerCommand('esp32-pm.remove-auto-gen', async () => {
		// Execute this command only if the project is an ESP32-PM one.
		if (!await isEsp32PmProject()) {
			vscode.window.showErrorMessage("The current workspace is not an ESP32-PM project or it has not been initialized.");
			return;
		}

		// Remove auto-generated files.
		var workspaceFolders = vscode.workspace.workspaceFolders;
		if (workspaceFolders) {
			vscode.workspace.fs.delete(vscode.Uri.file(join(workspaceFolders[0].uri.fsPath, "main/main.c")));
			vscode.workspace.fs.delete(vscode.Uri.file(join(workspaceFolders[0].uri.fsPath, "main/main.cpp")));
			vscode.workspace.fs.delete(vscode.Uri.file(join(workspaceFolders[0].uri.fsPath, "sdkconfig")));
			vscode.workspace.fs.delete(vscode.Uri.file(join(workspaceFolders[0].uri.fsPath, "sdkconfig.old")));
			vscode.workspace.fs.delete(vscode.Uri.file(join(workspaceFolders[0].uri.fsPath, "build")));
		}
	}));

}

export function deactivate() { }
