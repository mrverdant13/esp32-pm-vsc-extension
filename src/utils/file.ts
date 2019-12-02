import * as vscode from 'vscode';

export async function readFile(filePath: string): Promise<string> {
    try {
        // Return file content as string.
        return (await vscode.workspace.fs.readFile(vscode.Uri.file(filePath))).toString().trim();
    } catch (error) {
        throw error;
    }
}

export async function writeFile(filePath: string, content: string): Promise<void> {
    try {
        // Write content to file.
        await vscode.workspace.fs.writeFile(
            vscode.Uri.file(filePath),
            Buffer.from(content)
        );
    } catch (error) {
        throw error;
    }
}

export async function replaceInFile(filePath: string, find: RegExp, replace: string): Promise<void> {
    try {
        // Read file.
        const fileContent: string = await readFile(filePath);

        // Replace value in content and write to file.
        await writeFile(
            filePath,
            fileContent.replace(find, replace)
        );
    } catch (error) {
        throw error;
    }
}
