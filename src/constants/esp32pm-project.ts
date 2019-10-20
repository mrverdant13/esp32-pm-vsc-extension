export namespace Paths {
    // ESP32-PM project config file.
    export const LocalConfigFile: string = '.vscode/local_esp32pm_config.json';

    // VSCode settings file.
    export const VscSettingsFile: string = '.vscode/settings.json';

    // VSCode C/C++ properties file.
    export const VscCCppPropsFile: string = '.vscode/c_cpp_properties.json';

    // Menuconfig bash file.
    export const MenuconfigBashFile: string = '.vscode/Menuconfig.sh';

    // Characteristic files of an ESP32-PM project.
    export const Files: Array<string> = [
        LocalConfigFile,
        VscSettingsFile,
        VscCCppPropsFile,
        MenuconfigBashFile,
    ];

    // Sub-projects folder.
    export const SubprojectsFolder: string = 'main/src/';

    // Characteristic folders of an ESP32-PM project.
    export const Folders: Array<string> = [
        SubprojectsFolder,
    ];
}