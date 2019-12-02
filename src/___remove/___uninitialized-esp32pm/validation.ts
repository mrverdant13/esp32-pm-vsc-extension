// import * as PathUtils from '../../utils/path';
// import * as ValidationUtils from '../../utils/validation';
// import * as VscUtils from '../../utils/vsc';

// // import { validateEspressifProj } from '../espressif/validation';

// import * as Paths from './paths';
// import { EspressifProj } from '../espressif_proj';

// export async function validateUninitializedEsp32pmProj() {
//     // TODO: Include resource checking (IDF_PATH, XTENSA_PATH, MSYS32_PATH).
//     try {
//         const workspacePath: string = VscUtils.getWorkspacePath();

//         await EspressifProj.validate();
//         if (!await ValidationUtils.validate(
//             PathUtils.prefixPaths(workspacePath, Paths.MandatoryFiles),
//             PathUtils.prefixPaths(workspacePath, Paths.MandatoryFolders),
//             Paths.MutuallyExclusiveFilesGroup.map<Array<string>>((files, _, __) => PathUtils.prefixPaths(workspacePath, files)),
//             Paths.MutuallyExclusiveFoldersGroup.map<Array<string>>((files, _, __) => PathUtils.prefixPaths(workspacePath, files)),
//         )) {
//             // )) && validateEspressifProj())) {
//             throw Error('The current workspace does not contain an ESP32-PM project.');
//         }
//     } catch (error) {
//         throw error;
//     }
// }
