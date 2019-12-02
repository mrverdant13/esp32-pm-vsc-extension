import * as PathUtils from "../utils/path";

export namespace ExtensionPaths{
    export const ProjectTemplate: string = 'assets/templates/project';

    export const SerialPortGeneratorFile: string = 'assets/scripts/GenerateSerialPortsList.sh';

    export const VscSettingsFile: string = PathUtils.joinPaths(ProjectTemplate, '.vscode/settings.json');

    export const VscCCppPropsFile: string = PathUtils.joinPaths(ProjectTemplate, '.vscode/c_cpp_properties.json');
}