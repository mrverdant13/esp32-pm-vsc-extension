import * as vscode from 'vscode';
import { lstatSync, readdirSync } from 'fs';
import { join } from 'path';

export function activate(context: vscode.ExtensionContext) {

	function delay(ms: number) {
		return new Promise(resolve => setTimeout(resolve, ms));
	}

	function createEspIdfTerminal(name: string): vscode.Terminal {
		const _terminal = vscode.window.createTerminal({
			env: {
				"CHERE_INVOKING": "1",
				"MSYSTEM": "MINGW32",
				"workspaceDir": "${workspaceFolder}"
			},
			name: name,
			shellArgs: ["--login"],
			shellPath: 'C:/msys32/usr/bin/bash.exe',
		});
		_terminal.hide();
		_terminal.sendText("stty -echo && tput rs1");
		return _terminal;
	}

	context.subscriptions.push(vscode.commands.registerCommand('extension.defconfig', () => {
		const terminal = createEspIdfTerminal("Defconfig");
		terminal.show(true);
		terminal.sendText("make defconfig && history -c && exit");
	}));

	context.subscriptions.push(vscode.commands.registerCommand('extension.menuconfig', () => {
		const terminal = createEspIdfTerminal("Menuconfig");
		terminal.show(true);
		terminal.sendText("sh " + context.extensionPath.replace(/\\/gi, '/') + "/assets/scripts/Menuconfig.sh && history -c && exit");
	}));

	async function showQuickPickFrom(elements: string[], hint: string) {
		return await vscode.window.showQuickPick(
			elements,
			{ placeHolder: hint }
		);
	}

	function getFolders(path: string): string[] {
		var folders: string[] = [];
		var workspaceFolders = vscode.workspace.workspaceFolders;
		if (workspaceFolders) {
			var finalPath: string = join(workspaceFolders[0].uri.fsPath, path);
			readdirSync(finalPath).forEach((element) => {
				if (lstatSync(join(finalPath, element)).isDirectory()) {
					folders.push(element);
				}
			});
		}
		return folders;
	}

	function getFiles(path: string): string[] {
		var files: string[] = [];
		var workspaceFolders = vscode.workspace.workspaceFolders;
		if (workspaceFolders) {
			var finalPath: string = join(workspaceFolders[0].uri.fsPath, path);
			readdirSync(finalPath).forEach((element) => {
				if (lstatSync(join(finalPath, element)).isFile()) {
					files.push(element);
				}
			});
		}
		return files;
	}

	context.subscriptions.push(vscode.commands.registerCommand('extension.buildTest', async () => {
		var testFolder: string = 'main/test/';
		var entryPointPrefix: string = 'main';
		var entryPointSufixCpp: string = '.cpp';
		var entryPointSufixC: string = '.c';
		var selectedTestFolder = await showQuickPickFrom(getFolders(testFolder), 'Test to be built');
		if (!selectedTestFolder) { vscode.window.showWarningMessage("No test selected."); return; }
		var entryPoints: string[] = [];
		getFiles(join(testFolder, selectedTestFolder)).forEach((file) => {
			if (file.startsWith(entryPointPrefix) && (file.endsWith(entryPointSufixCpp) || file.endsWith(entryPointSufixC))) { entryPoints.push(file); }
		});
		var testFile: string | undefined;
		if (entryPoints.length === 0) { vscode.window.showErrorMessage("There is no entry point for the selected test."); return; }
		else if (entryPoints.length === 1) { testFile = entryPoints[0]; }
		else {
			testFile = await showQuickPickFrom(entryPoints, "Entry point for the test.");
			if (!testFile) { vscode.window.showErrorMessage("No entry point selected."); return; }
		}

		const terminal = createEspIdfTerminal("Build test");
		terminal.show(true);
		terminal.sendText('export testFile="' + selectedTestFolder + '/' + testFile + '"');
		terminal.sendText("sh " + context.extensionPath.replace(/\\/gi, '/') + "/assets/scripts/BuildTest.sh && history -c && exit");
	}));

	async function getSerialPorts() {
		const comPortsFile: string = "comPortsFile";
		const terminal = createEspIdfTerminal("Generate serial ports");
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
		while (!serialPortsChecked) { await delay(100); }
		fsw.dispose();
		return serialPorts;
	}

	context.subscriptions.push(vscode.commands.registerCommand('extension.flash', async () => {
		var serialPorts: string[] = await getSerialPorts();
		console.log(serialPorts);
		if (serialPorts.length === 0) { vscode.window.showErrorMessage('No serial port available.'); return; }
		var selectedSerialPort = await showQuickPickFrom(serialPorts, 'Serial port to be used');
		if (!selectedSerialPort) { vscode.window.showErrorMessage("No serial port selected."); return; }
		const terminal = createEspIdfTerminal("Flash");
		terminal.show(true);
		terminal.sendText('make flash ESPPORT=' + selectedSerialPort + ' && history -c && exit');
	}));

	context.subscriptions.push(vscode.commands.registerCommand('extension.monitor', async () => {
		var serialPorts: string[] = await getSerialPorts();
		console.log(serialPorts);
		if (serialPorts.length === 0) { vscode.window.showErrorMessage('No serial port available.'); return; }
		var selectedSerialPort = await showQuickPickFrom(serialPorts, 'Serial port to be used');
		if (!selectedSerialPort) { vscode.window.showErrorMessage("No serial port selected."); return; }
		const terminal = createEspIdfTerminal("Monitor");
		terminal.show(true);
		terminal.sendText('make monitor ESPPORT=' + selectedSerialPort + ' && history -c && exit');
	}));

}

export function deactivate() { }
