// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// make defconfig
	context.subscriptions.push(vscode.commands.registerCommand('extension.defconfig', () => {
		const terminal = vscode.window.createTerminal({
			env: {
				"CHERE_INVOKING": "1",
				"MSYSTEM": "MINGW32",
				"workspaceDir": "${workspaceFolder}"
			},
			name: `make defconfig`,
			shellArgs: ["--login"],
			shellPath: 'C:/msys32/usr/bin/bash.exe',
		});
		terminal.show(true);
		terminal.sendText("make defconfig");
	}));

	context.subscriptions.push(vscode.commands.registerCommand('extension.test', () => {
		vscode.window.showInformationMessage('Test');
	}));
}

export function deactivate() { }
