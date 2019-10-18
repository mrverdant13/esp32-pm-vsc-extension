export namespace Paths {
    // File to store extension values.
    export const extensionValuesFile: string = 'assets/local-data/values.json';

    // VSCode settings template file.
    export const projectTemplatePath: string = 'assets/projectTemplate/';

    // VSCode settings template file.
    export const vscSettingsTemplateFile: string = 'assets/configTemplate/_settings.json';

    // VSCode C/C++ properties template file.
    export const vscCCppPropsTemplateFile: string = 'assets/configTemplate/_c_cpp_properties.json';
}

export namespace BoundedConsts {
    // Constant bounder.
    export const Bounder: string = ':';

    // Bounded constant string for the ESP-IDF API path.
    export const IdfPath: string = 'IDF_PATH';

    // Bounded constant string for the project name.
    export const ProjectName: string = 'PROJECT_NAME';

    // Bounded constant string for the Espressif Toolchain path.
    export const ToolchainPath: string = 'TOOLCHAIN_PATH';

    // Bounded constant strings.
    export const boundedConstants: Array<string> = [
        IdfPath,
        ProjectName,
        ToolchainPath,
    ];
}