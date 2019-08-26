import * as vscode from 'vscode';
import { lstatSync, readdirSync } from 'fs';
import { join } from 'path';

import * as utils from './utils';

export function activate(context: vscode.ExtensionContext) {

	context.subscriptions.push(vscode.commands.registerCommand('extension.create-project', async () => {
		var introducedName = await vscode.window.showInputBox({ prompt: "Name of the new project" });
		if (!introducedName || introducedName.trim().length === 0) { vscode.window.showErrorMessage("Name project not introduced"); return; }
		introducedName = introducedName.trim().replace(/ (?= )/gi, '').replace(/ /gi, '-').toLowerCase();
		var projectLocation = await vscode.window.showOpenDialog({
			canSelectFiles: false,
			canSelectFolders: true,
			canSelectMany: false,
			openLabel: "Select project location"
		});
		var useNewWindow = await showQuickPickFrom(["Open in new window", "Open in current window"], "");
		if (!useNewWindow) { vscode.window.showErrorMessage("Project creation cancelled"); return; }
		if (!projectLocation) { vscode.window.showErrorMessage("Project location not selected"); return; }
		introducedName = join(projectLocation[0].fsPath, introducedName);
		await vscode.workspace.fs.copy(
			vscode.Uri.file(join(context.extensionPath, "/assets/projectTemplate")),
			vscode.Uri.file(introducedName),
			{ overwrite: false }
		);
		await vscode.workspace.fs.rename(vscode.Uri.file(join(introducedName, "_vscode")), vscode.Uri.file(join(introducedName, ".vscode")));
		await vscode.workspace.fs.rename(vscode.Uri.file(join(introducedName, ".vscode/_gitignore")), vscode.Uri.file(join(introducedName, ".vscode/.gitignore")));
		vscode.commands.executeCommand("vscode.openFolder", vscode.Uri.file(introducedName), useNewWindow.includes("new"));
	}));

	context.subscriptions.push(vscode.commands.registerCommand('extension.init-project', async () => {
		var projectLocation = await vscode.window.showOpenDialog({
			canSelectFiles: false,
			canSelectFolders: true,
			canSelectMany: false,
			openLabel: "Select project folder"
		});
		if (!projectLocation) { vscode.window.showErrorMessage("Project location not selected"); return; }
		if (!await utils.folderExists(join(projectLocation[0].fsPath, "main")) || !await utils.fileExists(join(projectLocation[0].fsPath, "Makefile"))) {
			vscode.window.showErrorMessage("The folder does not contain an ESP-IDF project");
			return;
		}
		if (!await utils.folderExists(join(projectLocation[0].fsPath, "main/test"))) {
			vscode.window.showErrorMessage('The project must use a "test" directory inside the "main" folder.');
			return;
		}
		vscode.window.showWarningMessage("Some files (main/main.c, main/main.cpp, .vscode/settings.js, .vscode/c_cpp_properties.js) may be removed. Do you want to continue?");
		var removeFiles = await showQuickPickFrom(["Continue", "Cancell"], "Do you wan to continue?");
		if (!removeFiles) { vscode.window.showErrorMessage("Project opening cancelled"); return; }
		var useNewWindow = await showQuickPickFrom(["Open in new window", "Open in current window"], "");
		if (!useNewWindow) { vscode.window.showErrorMessage("Project opening cancelled"); return; }
		if (removeFiles.includes("Cancell")) { vscode.window.showErrorMessage("Project opening cancelled"); return; }
		vscode.workspace.fs.delete(vscode.Uri.file(join(projectLocation[0].fsPath, "main/main.c")));
		vscode.workspace.fs.delete(vscode.Uri.file(join(projectLocation[0].fsPath, "main/main.cpp")));
		await vscode.workspace.fs.copy(
			vscode.Uri.file(join(context.extensionPath, "/assets/projectTemplate/_vscode/settings.json")),
			vscode.Uri.file(join(projectLocation[0].fsPath, ".vscode/settings.json")),
			{ overwrite: true }
		);
		await vscode.workspace.fs.copy(
			vscode.Uri.file(join(context.extensionPath, "/assets/projectTemplate/_vscode/c_cpp_properties.json")),
			vscode.Uri.file(join(projectLocation[0].fsPath, ".vscode/c_cpp_properties.json")),
			{ overwrite: true }
		);
		vscode.commands.executeCommand("vscode.openFolder", projectLocation[0], useNewWindow.includes("new"));
	}));

	context.subscriptions.push(vscode.commands.registerCommand('extension.defconfig', async () => {
		if (!await utils.isEsp32idfProject()) { vscode.window.showErrorMessage("The current workspace is not an ESP32-IDF project or it has not been initialized."); return; }
		const terminal = utils.createEspIdfTerminal("Defconfig");
		terminal.show(true);
		terminal.sendText("make defconfig && history -c && exit");
	}));

	context.subscriptions.push(vscode.commands.registerCommand('extension.menuconfig', async () => {
		if (!await utils.isEsp32idfProject()) { vscode.window.showErrorMessage("The current workspace is not an ESP32-IDF project or it has not been initialized."); return; }
		const terminal = utils.createEspIdfTerminal("Menuconfig");
		terminal.show(true);
		terminal.sendText("set CHERE_INVOKING=1 && start C:/msys32/mingw32.exe make menuconfig && history -c && exit");
	}));

	async function showQuickPickFrom(elements: string[], hint: string) {
		return await vscode.window.showQuickPick(
			elements,
			{ placeHolder: hint }
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

		const terminal = utils.createEspIdfTerminal("Build test");
		terminal.show(true);
		terminal.sendText('export testFile="' + selectedTestFolder + '/' + testFile + '"');
		terminal.sendText("sh " + context.extensionPath.replace(/\\/gi, '/') + "/assets/scripts/BuildTest.sh && history -c && exit");
	}));

	async function getSerialPorts() {
		const comPortsFile: string = "comPortsFile";
		const terminal = utils.createEspIdfTerminal("Generate serial ports");
		terminal.sendText('export comPortsFile="' + comPortsFile + '" && sh ' + context.extensionPath.replace(/\\/gi, '/') + "/assets/scripts/GenerateComList.sh && history -c && exit");
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
		const terminal = utils.createEspIdfTerminal("Flash");
		terminal.show(true);
		terminal.sendText('make flash ESPPORT=' + selectedSerialPort + ' && history -c && exit');
	}));

	context.subscriptions.push(vscode.commands.registerCommand('extension.monitor', async () => {
		if (!await utils.isEsp32idfProject()) { vscode.window.showErrorMessage("The current workspace is not an ESP32-IDF project or it has not been initialized."); return; }
		var serialPorts: string[] = await getSerialPorts();
		if (serialPorts.length === 0) { vscode.window.showErrorMessage('No serial port available.'); return; }
		var selectedSerialPort = await showQuickPickFrom(serialPorts, 'Serial port to be used');
		if (!selectedSerialPort) { vscode.window.showErrorMessage("No serial port selected."); return; }
		const terminal = utils.createEspIdfTerminal("Monitor");
		terminal.show(true);
		terminal.sendText('make monitor ESPPORT=' + selectedSerialPort + ' && history -c && exit');
	}));

	context.subscriptions.push(vscode.commands.registerCommand('extension.flash-monitor', async () => {
		if (!await utils.isEsp32idfProject()) { vscode.window.showErrorMessage("The current workspace is not an ESP32-IDF project or it has not been initialized."); return; }
		var serialPorts: string[] = await getSerialPorts();
		if (serialPorts.length === 0) { vscode.window.showErrorMessage('No serial port available.'); return; }
		var selectedSerialPort = await showQuickPickFrom(serialPorts, 'Serial port to be used');
		if (!selectedSerialPort) { vscode.window.showErrorMessage("No serial port selected."); return; }
		const terminal = utils.createEspIdfTerminal("Flash & Monitor");
		terminal.show(true);
		terminal.sendText('make flash monitor ESPPORT=' + selectedSerialPort + ' && history -c && exit');
	}));

	context.subscriptions.push(vscode.commands.registerCommand('extension.clean', async () => {
		if (!await utils.isEsp32idfProject()) { vscode.window.showErrorMessage("The current workspace is not an ESP32-IDF project or it has not been initialized."); return; }
		const terminal = utils.createEspIdfTerminal("Clean");
		terminal.show(true);
		terminal.sendText('make clean && history -c && exit');
	}));

	context.subscriptions.push(vscode.commands.registerCommand('extension.remove-auto-gen', async () => {
		if (!await utils.isEsp32idfProject()) { vscode.window.showErrorMessage("The current workspace is not an ESP32-IDF project or it has not been initialized."); return; }
		const terminal = utils.createEspIdfTerminal("Remove auto-generated files");
		terminal.show(true);
		terminal.sendText('rm sdkcondig && rm sdkconfig.old && rm main/main.cpp && rm -r "build" && history -c && exit');
	}));

}

export function deactivate() { }
