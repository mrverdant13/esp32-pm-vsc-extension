export namespace Paths {
    // Sub-projects folder.
    export const SubprojectsFolder: string = 'main/src/';

    // ESP32-PM project values file.
    export const ProjectValuesFile = '.vscode/esp32-pm.json';

    // VSCode settings file.
    export const VscSettingsFile = '.vscode/settings.json';

    // VSCode C/C++ properties file.
    export const VscCCppPropsFile = '.vscode/c_cpp_properties.json';

    // VSCode C/C++ properties file.
    export const MenuconfigBashFile = '.vscode/Menuconfig.sh';

    // Characteristic folders of an ESP32-PM project.
    export const Esp32PmFolders: Array<string> = [
        Paths.SubprojectsFolder,
    ];

    // Characteristic files of an ESP32-PM project.
    export const Esp32PmFiles: Array<string> = [
        Paths.VscSettingsFile,
        Paths.VscCCppPropsFile,
    ];

    // Files to be overwritten when initializing an existing project.
    export const overwritingFiles: Array<string> = [
        'main/main.c',
        'main/main.cpp',
        Paths.VscSettingsFile,
        Paths.VscCCppPropsFile,
    ];
}