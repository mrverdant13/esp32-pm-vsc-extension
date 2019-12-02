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

