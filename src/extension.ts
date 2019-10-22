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
	SupportedOSs,
	Paths,
} from './constants/extension-const';
import {
	Project,
	ProjectValidationType,
	ProjectPathType,
} from './models/esp32-pm-project';
import * as utils from './utils';

export function activate(context: vscode.ExtensionContext) {

	// Check if the OS is supported.
	{
		const isSupported: boolean = SupportedOSs.some((os) => {
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
			const newProjectPath: string = join(newProjectLocation, newProjectName);

			// Ask the user if the new project should be launched in the current window or in a new one.
			const windowAction: string = await utils.pickElement(
				['Open in new window', 'Open in current window'],
				'Select the window to be used with the new project.',
				'Process cancelled.',
			);

			// Copy the project template.
			await utils.copyElement(
				context.asAbsolutePath(Paths.ProjectTemplate),
				newProjectPath,
			);

			// Set the project name in the project Makefile
			await utils.replaceInFile(
				join(newProjectPath, 'Makefile'),
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
			await Project.setProjectResourcePath(ProjectPathType.MSYS32_PATH);
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

			// Set the 'msys32' folder to be used with the project.
			await Project.setProjectResourcePath(ProjectPathType.XTENSA_PATH);
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
			await Project.setProjectResourcePath(ProjectPathType.IDF_PATH);
		} catch (error) {
			// Show error message.
			vscode.window.showErrorMessage(error.message);
		}
	}));
}

export function deactivate() { }
