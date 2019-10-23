// Extension supported OSs.
export const SupportedOSs: Array<string> = [
    'win32',
    'linux',
];

export namespace Paths {
    // VSCode settings template file.
    export const ProjectTemplate: string = 'assets/templates/project/';

    // VSCode settings file.
    export const VscSettingsFile: string = ProjectTemplate + '.vscode/settings.json';

    // VSCode C/C++ properties file.
    export const VscCCppPropsFile: string = ProjectTemplate + '.vscode/c_cpp_properties.json';
}