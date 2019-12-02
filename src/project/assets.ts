import * as PathUtils from '../utils/path';

export namespace ProjectAssets {
    // Sub-projects folder name.
    export const SubProjectsFolderName: string = 'src';

    export const TempGeneratedSerialPortsFileName: string = 'tempSerialPortsFile.txt';

    export const FinalGeneratedSerialPortsFileName: string = 'finalSerialPortsFile.txt';

    // Make file.
    export const ProjMakeFile: string = 'Makefile';

    // CMake file.
    export const CMakeListFile: string = 'CMakeList.txt';

    // Main folder.
    export const MainFolder: string = 'main';

    // VSCode workspace settings file.
    export const VscSettingsFile: string = '.vscode/settings.json';

    // VSCode workspace C/C++ properties file.
    export const VscCCppPropsFile: string = '.vscode/c_cpp_properties.json';

    // Sub-projects folder.
    export const SubProjectsFolder: string = PathUtils.joinPaths('main', SubProjectsFolderName);

    // Available serial ports file.
    export const TempGeneratedSerialPortsFile: string = PathUtils.joinPaths('build', TempGeneratedSerialPortsFileName);

    // Available serial ports file.
    export const FinalGeneratedSerialPortsFile: string = PathUtils.joinPaths('build', FinalGeneratedSerialPortsFileName);
}