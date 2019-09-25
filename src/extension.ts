import * as vscode from 'vscode';
import { join } from 'path';

import * as utils from './utils';
import { PathsManager, PathType, Paths } from './paths';

export function activate(context: vscode.ExtensionContext) {

	context.subscriptions.push(vscode.commands.registerCommand('extension.register-espressif-toolchain', async () => {
		PathsManager.registerPath(context, PathType.MSYS32);
	}));

	context.subscriptions.push(vscode.commands.registerCommand('extension.register-esp-idf', async () => {
		PathsManager.registerPath(context, PathType.IDF);
	}));

	context.subscriptions.push(vscode.commands.registerCommand('extension.create-project', async () => {

		// Ask the user for the new project name.
		var introducedName: string | undefined = await vscode.window.showInputBox({ prompt: "Name of the new project" });
		if (introducedName === undefined || introducedName.trim().length === 0) { vscode.window.showErrorMessage("Project name not introduced"); return; }
		introducedName = introducedName.trim().replace(/ (?= )/gi, '').replace(/ /gi, '_').toLowerCase();

		// Ask the user for the new project location.
		var projectLocation = await vscode.window.showOpenDialog({
			canSelectFiles: false,
			canSelectFolders: true,
			canSelectMany: false,
			openLabel: "Select project location"
		});
		if (projectLocation === undefined) { vscode.window.showErrorMessage("Project location not selected."); return; }

		// Ask the user which MinGW32 terminal and ESP-IDF API are going to be used with the project.
		const paths: Paths = await PathsManager.getValues(context);
		var msys32Path = await showQuickPickFrom(paths.msys32Paths, "MinGW32 terminal to be used");
		if (msys32Path === undefined) { vscode.window.showErrorMessage("MinGW32 terminal not selected."); return; }
		var idfPath = await showQuickPickFrom(paths.idfPaths, "ESP-IDF API to be used");
		if (idfPath === undefined) { vscode.window.showErrorMessage("ESP-IDF API not selected."); return; }

		// Ask the user if the new project should be launched in the current window or in a new one.
		var useNewWindow = await showQuickPickFrom(["Open in new window", "Open in current window"], "");
		if (!useNewWindow) { vscode.window.showErrorMessage("Project creation cancelled"); return; }

		// Set the new project path.
		var projectPath: string = join(projectLocation[0].fsPath, introducedName);

		// Copy the project template.
		await vscode.workspace.fs.copy(
			vscode.Uri.file(join(context.extensionPath, "/assets/projectTemplate")),
			vscode.Uri.file(projectPath),
			{ overwrite: false }
		);

		// Use the selected MinGW32 terminal and ESP-IDF API
		msys32Path = msys32Path.replace(/\\/gi, '/');
		idfPath = idfPath.replace(/\\/gi, '/');
		var vscSettings: string = (await vscode.workspace.fs.readFile(vscode.Uri.file(join(projectPath, '_vscode/_settings.json')))).toString();
		vscSettings = vscSettings.replace(/\:MSYS32_PATH\:/gi, msys32Path);
		vscSettings = vscSettings.replace(/\:IDF_PATH\:/gi, idfPath);
		await vscode.workspace.fs.writeFile(
			vscode.Uri.file(join(projectPath, '_vscode/_settings.json')),
			Buffer.from(vscSettings)
		);
		var vscCCppProperties: string = (await vscode.workspace.fs.readFile(vscode.Uri.file(join(projectPath, '_vscode/_c_cpp_properties.json')))).toString();
		vscCCppProperties = vscCCppProperties.replace(/\:MSYS32_PATH\:/gi, msys32Path);
		vscCCppProperties = vscCCppProperties.replace(/\:IDF_PATH\:/gi, idfPath);
		await vscode.workspace.fs.writeFile(
			vscode.Uri.file(join(projectPath, '_vscode/_c_cpp_properties.json')),
			Buffer.from(vscCCppProperties)
		);

		// Rename configuration elements.
		await vscode.workspace.fs.rename(vscode.Uri.file(join(projectPath, "_vscode/_settings.json")), vscode.Uri.file(join(projectPath, "_vscode/settings.json")));
		await vscode.workspace.fs.rename(vscode.Uri.file(join(projectPath, "_vscode/_c_cpp_properties.json")), vscode.Uri.file(join(projectPath, "_vscode/c_cpp_properties.json")));
		await vscode.workspace.fs.rename(vscode.Uri.file(join(projectPath, "_vscode")), vscode.Uri.file(join(projectPath, ".vscode")));

		// Launch the new project according to the user election.
		await vscode.commands.executeCommand("vscode.openFolder", vscode.Uri.file(projectPath), useNewWindow.includes("new"));
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

	context.subscriptions.push(vscode.commands.registerCommand('extension.build-subproject', async () => {
		if (!await utils.isEsp32idfProject()) { vscode.window.showErrorMessage("The current workspace is not an ESP32-IDF project or it has not been initialized."); return; }
		var subprojectsFolder: string = 'main/src/';
		var entryPointPrefix: string = 'main';
		var entryPointSufixCpp: string = '.cpp';
		var entryPointSufixC: string = '.c';
		var workspaceFolders = vscode.workspace.workspaceFolders;
		if (!workspaceFolders) { return; }
		var selectedSubprojectFolder = await showQuickPickFrom(utils.getFolders(join(workspaceFolders[0].uri.fsPath, subprojectsFolder)), 'Sub-project to be built');
		if (!selectedSubprojectFolder) { vscode.window.showWarningMessage("Sub-project not selected."); return; }
		var entryPoints: string[] = [];
		utils.getFiles(join(workspaceFolders[0].uri.fsPath, subprojectsFolder, selectedSubprojectFolder)).forEach((file) => {
			if (file.startsWith(entryPointPrefix) && (file.endsWith(entryPointSufixCpp) || file.endsWith(entryPointSufixC))) { entryPoints.push(file); }
		});
		var entryPoint: string | undefined;
		if (entryPoints.length === 0) { vscode.window.showErrorMessage("There is no entry point for the selected sub-project."); return; }
		else if (entryPoints.length === 1) { entryPoint = entryPoints[0]; }
		else {
			entryPoint = await showQuickPickFrom(entryPoints, "Entry point for the sub-project.");
			if (!entryPoint) { vscode.window.showErrorMessage("No entry point selected."); return; }
		}

		utils.executeShellCommands(
			"Build sub-project",
			[
				'echo "ESP32-IDF: Building sub-project...\n"',
				'export entryPoint="' + selectedSubprojectFolder + '/' + entryPoint + '"',
				"sh " + context.extensionPath.replace(/\\/gi, '/') + "/assets/scripts/BuildSubproject.sh",
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

		// Remove auto-generated files.
		var workspaceFolders = vscode.workspace.workspaceFolders;
		if (workspaceFolders) {
			vscode.workspace.fs.delete(vscode.Uri.file(join(workspaceFolders[0].uri.fsPath, "main/main.c")));
			vscode.workspace.fs.delete(vscode.Uri.file(join(workspaceFolders[0].uri.fsPath, "main/main.cpp")));
			vscode.workspace.fs.delete(vscode.Uri.file(join(workspaceFolders[0].uri.fsPath, "sdkconfig")));
			vscode.workspace.fs.delete(vscode.Uri.file(join(workspaceFolders[0].uri.fsPath, "build")));
		}
	}));

}

export function deactivate() { }
