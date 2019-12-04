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

export function executeShellCommands(name: string, commandLines: Array<string>): void {
    try {
        // Create a task related to a terminal which will execute the passed commands.
        const task = new vscode.Task(
            { type: "shell" },
            vscode.TaskScope.Workspace,
            name,
            "ESP32-PM",
            new vscode.ShellExecution(commandLines.join(" && "))
        );

        // The executed commands will not be printed.
        task.presentationOptions.echo = false;

        // The terminal will be first cleared.
        task.presentationOptions.clear = true;

        // The generated terminal will take focus.
        task.presentationOptions.focus = true;

        // Use the same panel for command terminal execution.
        task.presentationOptions.panel = vscode.TaskPanelKind.Shared;

        // Execute the task.
        vscode.tasks.executeTask(task);
    } catch (error) {
        throw error;
    }
}

