import * as vscode from 'vscode';
import { join } from 'path';

import * as utils from './utils';

export function activate(context: vscode.ExtensionContext) {

	context.subscriptions.push(vscode.commands.registerCommand('extension.install-esp-idf', async () => {

		// Values
		const tempFileName: string = 'temp.txt';
		const executionName: string = 'Cloning ESP-IDF';
		const lastIdfFolderName: string = 'esp-idf.old';

		// The user must select the location of the 'msys32' folder.
		var msys32Location = await vscode.window.showOpenDialog({
			canSelectFiles: false,
			canSelectFolders: true,
			canSelectMany: false,
			openLabel: "Select 'msys32' location"
		});

		// If the location is 'undefined', it has not been selected.
		if (!msys32Location) { vscode.window.showErrorMessage("'msys32' location not selected"); return; }

		// The user may have chosen the 'msys32' folder or its container.
		msys32Location[0] = vscode.Uri.file(join(msys32Location[0].fsPath, msys32Location[0].fsPath.endsWith('msys32') ? '' : 'msys32'));

		// If the folders '.../msys32/home/' or '.../msys32/etc/profile.d/' do not exist, the 'msys32' folder is invalid.
		if (!await utils.folderExists(join(msys32Location[0].fsPath, 'home')) || !await utils.folderExists(join(msys32Location[0].fsPath, 'etc/profile.d'))) { vscode.window.showErrorMessage("Invalid 'msys32' location."); return; }

		// The 'msys32' folder location must not include empty spaces.
		if (msys32Location[0].fsPath.includes(" ")) { vscode.window.showErrorMessage("The 'msys32' path should not include spaces."); return; }

		// Export the MSYS32_PATH variable.
		await vscode.workspace.fs.writeFile(
			vscode.Uri.file(join(msys32Location[0].fsPath, 'etc/profile.d/export_msys32_path.sh')),
			Buffer.from('export MSYS32_PATH="' + msys32Location[0].fsPath.replace(/\\/gi, '/') + '"')
		);

		// Remove the '$tempFileName' file that is used as a success indicator.
		if (utils.fileExists(join(msys32Location[0].fsPath, 'home', tempFileName))) {
			await vscode.workspace.fs.delete(vscode.Uri.file(join(msys32Location[0].fsPath, 'home', tempFileName)));
		}

		// Rename any existing 'esp-idf' folder as 'esp-idf.old'.
		if (utils.folderExists(join(msys32Location[0].fsPath, 'home/esp-idf'))) {
			if (utils.folderExists(join(msys32Location[0].fsPath, 'home', lastIdfFolderName))) {
				await vscode.workspace.fs.delete(vscode.Uri.file(join(msys32Location[0].fsPath, 'home', lastIdfFolderName)));
			}
			await vscode.workspace.fs.rename(vscode.Uri.file(join(msys32Location[0].fsPath, 'home/esp-idf')), vscode.Uri.file(join(msys32Location[0].fsPath, 'home/esp-idf.old')));
		}

		// Clone the ESP-IDF and create the '$tempFileName' file to indicate success.
		utils.executeShellCommands(
			executionName,
			[
				'echo ' + executionName + '...',
				'cd "' + join(msys32Location[0].fsPath, 'home').replace(/\\/gi, '/') + '"',
				'git clone --recursive https://github.com/espressif/esp-idf.git',
				'echo "Done" >> ' + tempFileName,
			],
		);

		// Wait until the task finishes.
		var taskFinished: boolean = false;
		var disp = vscode.tasks.onDidEndTask((event) => {
			if (event.execution.task.name === executionName) {
				taskFinished = true;
			}
		});
		while (!taskFinished) { await utils.delay(100); }
		disp.dispose();

		// Check if the cloning process was successful.
		if (!utils.fileExists(join(msys32Location[0].fsPath, 'home', tempFileName))) { vscode.window.showErrorMessage("The ESP-IDF could not be cloned."); return; }

		// Export the IDF_PATH variable.
		await vscode.workspace.fs.writeFile(
			vscode.Uri.file(join(msys32Location[0].fsPath, 'etc/profile.d/export_idf_path.sh')),
			Buffer.from('export IDF_PATH="' + join(msys32Location[0].fsPath, 'home/esp-idf').replace(/\\/gi, '/') + '"')
		);

		// Update the VSC integrated terminal path.
		var documentContent = (await vscode.workspace.openTextDocument(join(context.extensionPath, 'assets/projectTemplate/_vscode/_settings.json'))).getText();
		documentContent = documentContent.replace(/BASH_PATH/gi, join(msys32Location[0].fsPath, 'usr/bin/bash.exe').replace(/\\/gi, '/'));
		await vscode.workspace.fs.writeFile(
			vscode.Uri.file(join(context.extensionPath, 'assets/projectTemplate/_vscode/settings.json')),
			Buffer.from(documentContent)
		);

		// Update the VSC C/C++ properties.
		documentContent = (await vscode.workspace.openTextDocument(join(context.extensionPath, 'assets/projectTemplate/_vscode/_c_cpp_properties.json'))).getText();
		documentContent = documentContent.replace(/MSYS32_PATH/gi, msys32Location[0].fsPath.replace(/\\/gi, '/'));
		await vscode.workspace.fs.writeFile(
			vscode.Uri.file(join(context.extensionPath, 'assets/projectTemplate/_vscode/c_cpp_properties.json')),
			Buffer.from(documentContent)
		);

		// Notify the successful ESP-IDF installation
		vscode.window.showInformationMessage("ESP32-IDF successfully installed.");
	}));

	context.subscriptions.push(vscode.commands.registerCommand('extension.create-project', async () => {

		// Ask the user for the new project name.
		var introducedName = await vscode.window.showInputBox({ prompt: "Name of the new project" });
		if (!introducedName || introducedName.trim().length === 0) { vscode.window.showErrorMessage("Name project not introduced"); return; }
		introducedName = introducedName.trim().replace(/ (?= )/gi, '').replace(/ /gi, '-').toLowerCase();

		// Ask the user for the new project location.
		var projectLocation = await vscode.window.showOpenDialog({
			canSelectFiles: false,
			canSelectFolders: true,
			canSelectMany: false,
			openLabel: "Select project location"
		});
		if (!projectLocation) { vscode.window.showErrorMessage("Project location not selected"); return; }

		// Ask the user if the new project should be launched in the current window or in a new one.
		var useNewWindow = await showQuickPickFrom(["Open in new window", "Open in current window"], "");
		if (!useNewWindow) { vscode.window.showErrorMessage("Project creation cancelled"); return; }

		// Set the new project path.
		introducedName = join(projectLocation[0].fsPath, introducedName);

		// Copy the project template.
		await vscode.workspace.fs.copy(
			vscode.Uri.file(join(context.extensionPath, "/assets/projectTemplate")),
			vscode.Uri.file(introducedName),
			{ overwrite: false }
		);

		// Rename the '_vscode' folder to '.vscode'.
		await vscode.workspace.fs.rename(vscode.Uri.file(join(introducedName, "_vscode")), vscode.Uri.file(join(introducedName, ".vscode")));

		// Remove the '_c_cpp_properties.json' and '_settings.json' files.
		await vscode.workspace.fs.delete(vscode.Uri.file(join(introducedName, ".vscode/_c_cpp_properties.json")));
		await vscode.workspace.fs.delete(vscode.Uri.file(join(introducedName, ".vscode/_settings.json")));

		// Launch the new project according to the user election.
		vscode.commands.executeCommand("vscode.openFolder", vscode.Uri.file(introducedName), useNewWindow.includes("new"));
	}));

	context.subscriptions.push(vscode.commands.registerCommand('extension.init-project', async () => {

		// Ask the user for the existing project location.
		var projectLocation = await vscode.window.showOpenDialog({
			canSelectFiles: false,
			canSelectFolders: true,
			canSelectMany: false,
			openLabel: "Select project folder"
		});
		if (!projectLocation) { vscode.window.showErrorMessage("Project location not selected"); return; }

		// Check if the provided folder contains an ESP-IDF project.
		if (!await utils.folderExists(join(projectLocation[0].fsPath, "main")) || !await utils.fileExists(join(projectLocation[0].fsPath, "Makefile"))) { vscode.window.showErrorMessage("The folder does not contain an ESP-IDF project"); return; }

		// Check if the provided folder contains an ESP32-IDF project.
		if (!await utils.folderExists(join(projectLocation[0].fsPath, "main/test"))) { vscode.window.showErrorMessage('The project must use a "test" directory inside the "main" folder.'); return; }

		// Ask the user for confirmation to remove files.
		var removeMain = await vscode.window.showWarningMessage("The following files will be removed: 'main/main.c', 'main/main.cpp'", 'Continue', 'Cancel');
		if (!removeMain || removeMain === 'Cancel') { vscode.window.showErrorMessage("Project initialization cancelled."); return; }

		// Ask the user if the new project should be launched in the current window or in a new one.
		var overwriteFiles = await showQuickPickFrom(["settings.json", "c_cpp_properties.json"], "Files that can be overwritten.", true);
		// if (!overwriteFiles) { vscode.window.showErrorMessage("Project creation cancelled"); return; }

		// Ask the user if the project should be launched in the current window or in a new one.
		var useNewWindow = await showQuickPickFrom(["Open in new window", "Open in current window"], "");
		if (!useNewWindow) { vscode.window.showErrorMessage("Project opening cancelled"); return; }

		// Remove 'main' files.
		vscode.workspace.fs.delete(vscode.Uri.file(join(projectLocation[0].fsPath, "main/main.c")));
		vscode.workspace.fs.delete(vscode.Uri.file(join(projectLocation[0].fsPath, "main/main.cpp")));

		// Overwrite the selected files
		if (overwriteFiles) {
			if (overwriteFiles.includes('settings.json')) {
				await vscode.workspace.fs.copy(
					vscode.Uri.file(join(context.extensionPath, "/assets/projectTemplate/_vscode/settings.json")),
					vscode.Uri.file(join(projectLocation[0].fsPath, ".vscode/settings.json")),
					{ overwrite: true }
				);
			}
			if (overwriteFiles.includes('c_cpp_properties.json')) {
				await vscode.workspace.fs.copy(
					vscode.Uri.file(join(context.extensionPath, "/assets/projectTemplate/_vscode/c_cpp_properties.json")),
					vscode.Uri.file(join(projectLocation[0].fsPath, ".vscode/c_cpp_properties.json")),
					{ overwrite: true }
				);
			}
		}

		// Create a new '.esp32-idf' file if it does not exist.
		if (!await utils.fileExists(join(projectLocation[0].fsPath, ".esp32-idf"))) {
			await vscode.workspace.fs.copy(
				vscode.Uri.file(join(context.extensionPath, "/assets/projectTemplate/.esp32-idf")),
				vscode.Uri.file(join(projectLocation[0].fsPath, ".esp32-idf")),
				{ overwrite: true }
			);
		}

		// Launch the project according to the user election.
		vscode.commands.executeCommand("vscode.openFolder", projectLocation[0], useNewWindow.includes("new"));
	}));

	context.subscriptions.push(vscode.commands.registerCommand('extension.defconfig', async () => {
		if (!await utils.isEsp32idfProject()) { vscode.window.showErrorMessage("The current workspace is not an ESP32-IDF project or it has not been initialized."); return; }
		utils.executeShellCommands(
			"Defconfig",
			[
				'echo "ESP32-IDF: Applying default config values...\n"',
				'make defconfig',
			]
		);
	}));

	context.subscriptions.push(vscode.commands.registerCommand('extension.menuconfig', async () => {
		if (!await utils.isEsp32idfProject()) { vscode.window.showErrorMessage("The current workspace is not an ESP32-IDF project or it has not been initialized."); return; }
		utils.executeShellCommands(
			"Menuconfig",
			[
				'echo "ESP32-IDF: Launching graphical config menu...\n"',
				'set CHERE_INVOKING=1',
				'start C:/msys32/mingw32.exe make menuconfig',
			]
		);
	}));

	async function showQuickPickFrom(elements: string[], hint: string, canPickMany: boolean = false) {
		return await vscode.window.showQuickPick(
			elements,
			{
				placeHolder: hint,
				canPickMany: canPickMany
			}
		);
	}

	context.subscriptions.push(vscode.commands.registerCommand('extension.build-test', async () => {
		if (!await utils.isEsp32idfProject()) { vscode.window.showErrorMessage("The current workspace is not an ESP32-IDF project or it has not been initialized."); return; }
		var testFolder: string = 'main/test/';
		var entryPointPrefix: string = 'main';
		var entryPointSufixCpp: string = '.cpp';
		var entryPointSufixC: string = '.c';
		var workspaceFolders = vscode.workspace.workspaceFolders;
		if (!workspaceFolders) { return; }
		var selectedTestFolder = await showQuickPickFrom(utils.getFolders(join(workspaceFolders[0].uri.fsPath, testFolder)), 'Test to be built');
		if (!selectedTestFolder) { vscode.window.showWarningMessage("No test selected."); return; }
		var entryPoints: string[] = [];
		utils.getFiles(join(workspaceFolders[0].uri.fsPath, testFolder, selectedTestFolder)).forEach((file) => {
			if (file.startsWith(entryPointPrefix) && (file.endsWith(entryPointSufixCpp) || file.endsWith(entryPointSufixC))) { entryPoints.push(file); }
		});
		var testFile: string | undefined;
		if (entryPoints.length === 0) { vscode.window.showErrorMessage("There is no entry point for the selected test."); return; }
		else if (entryPoints.length === 1) { testFile = entryPoints[0]; }
		else {
			testFile = await showQuickPickFrom(entryPoints, "Entry point for the test.");
			if (!testFile) { vscode.window.showErrorMessage("No entry point selected."); return; }
		}

		utils.executeShellCommands(
			"Build test",
			[
				'echo "ESP32-IDF: Building test...\n"',
				'export testFile="' + selectedTestFolder + '/' + testFile + '"',
				"sh " + context.extensionPath.replace(/\\/gi, '/') + "/assets/scripts/BuildTest.sh",
			]
		);
	}));

	async function getSerialPorts() {
		const comPortsFile: string = "comPortsFile";
		utils.executeShellCommands(
			'Generate serial ports',
			[
				'echo "ESP32-IDF: Generating serial ports list...\n"',
				'export comPortsFile="' + comPortsFile + '"',
				'sh ' + context.extensionPath.replace(/\\/gi, '/') + '/assets/scripts/GenerateComList.sh',
			]
		);
		var fsw: vscode.FileSystemWatcher = vscode.workspace.createFileSystemWatcher('**/build/' + comPortsFile, true, true, false);
		var serialPorts: string[] = [];
		var serialPortsChecked: boolean = false;
		fsw.onDidDelete(
			async () => {
				var workspaceFolders = vscode.workspace.workspaceFolders;
				if (workspaceFolders) {
					var fileContent = (await vscode.workspace.fs.readFile(vscode.Uri.file(workspaceFolders[0].uri.fsPath + "/build/" + comPortsFile + ".txt"))).toString().trim();
					if (fileContent.length > 0) { serialPorts = fileContent.split("\n"); }
				}
				serialPortsChecked = true;
			}
		);
		while (!serialPortsChecked) { await utils.delay(100); }
		fsw.dispose();
		return serialPorts;
	}

	context.subscriptions.push(vscode.commands.registerCommand('extension.flash', async () => {
		if (!await utils.isEsp32idfProject()) { vscode.window.showErrorMessage("The current workspace is not an ESP32-IDF project or it has not been initialized."); return; }
		var serialPorts: string[] = await getSerialPorts();
		if (serialPorts.length === 0) { vscode.window.showErrorMessage('No serial port available.'); return; }
		var selectedSerialPort = await showQuickPickFrom(serialPorts, 'Serial port to be used');
		if (!selectedSerialPort) { vscode.window.showErrorMessage("No serial port selected."); return; }
		utils.executeShellCommands(
			'Flash',
			[
				'echo "ESP32-IDF: Flashing project...\n"',
				'make flash ESPPORT=' + selectedSerialPort,
			]
		);
	}));

	context.subscriptions.push(vscode.commands.registerCommand('extension.monitor', async () => {
		if (!await utils.isEsp32idfProject()) { vscode.window.showErrorMessage("The current workspace is not an ESP32-IDF project or it has not been initialized."); return; }
		var serialPorts: string[] = await getSerialPorts();
		if (serialPorts.length === 0) { vscode.window.showErrorMessage('No serial port available.'); return; }
		var selectedSerialPort = await showQuickPickFrom(serialPorts, 'Serial port to be used');
		if (!selectedSerialPort) { vscode.window.showErrorMessage("No serial port selected."); return; }
		utils.executeShellCommands(
			'Monitor',
			[
				'echo "ESP32-IDF: Opening serial port...\n"',
				'make monitor ESPPORT=' + selectedSerialPort,
			]
		);
	}));

	context.subscriptions.push(vscode.commands.registerCommand('extension.flash-monitor', async () => {
		if (!await utils.isEsp32idfProject()) { vscode.window.showErrorMessage("The current workspace is not an ESP32-IDF project or it has not been initialized."); return; }
		var serialPorts: string[] = await getSerialPorts();
		if (serialPorts.length === 0) { vscode.window.showErrorMessage('No serial port available.'); return; }
		var selectedSerialPort = await showQuickPickFrom(serialPorts, 'Serial port to be used');
		if (!selectedSerialPort) { vscode.window.showErrorMessage("No serial port selected."); return; }
		utils.executeShellCommands(
			'Flash & Monitor',
			[
				'echo "ESP32-IDF: Flashing project and opening serial port...\n"',
				'make flash monitor ESPPORT=' + selectedSerialPort,
			]
		);
	}));

	context.subscriptions.push(vscode.commands.registerCommand('extension.clean', async () => {
		if (!await utils.isEsp32idfProject()) { vscode.window.showErrorMessage("The current workspace is not an ESP32-IDF project or it has not been initialized."); return; }
		utils.executeShellCommands(
			'Clean',
			[
				'echo "ESP32-IDF: Deleting build output files...\n"',
				'make clean',
				'echo "\nESP32-IDF: Build output files deleted.\n"',
			]
		);
	}));

	context.subscriptions.push(vscode.commands.registerCommand('extension.remove-auto-gen', async () => {
		if (!await utils.isEsp32idfProject()) { vscode.window.showErrorMessage("The current workspace is not an ESP32-IDF project or it has not been initialized."); return; }
		utils.executeShellCommands(
			'Remove auto-generated files',
			[
				'echo "ESP32-IDF: Deleting build output files...\n"',
				'sh ' + context.extensionPath.replace(/\\/gi, '/') + '/assets/scripts/RemoveAutoGen.sh',
				'echo "\nESP32-IDF: Build output files deleted.\n"',
			]
		);
	}));

}

export function deactivate() { }
