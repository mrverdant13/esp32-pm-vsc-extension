// import * as PathUtils from '../../utils/path';
// import * as ValidationUtils from '../../utils/validation';
// import * as VscUtils from '../../utils/vsc';

// // import { validateUninitializedEsp32pmProj } from '../uninitialized-esp32pm/validation';

// import * as Paths from './paths';

// export async function validateInitializedEsp32pmProj() {
//     try {
//         const workspacePath: string = VscUtils.getWorkspacePath();

//         if (!((await ValidationUtils.validate(
//             PathUtils.prefixPaths(workspacePath, Paths.MandatoryFiles),
//             PathUtils.prefixPaths(workspacePath, Paths.MandatoryFolders),
//             Paths.MutuallyExclusiveFilesGroup.map<Array<string>>((files, _, __) => PathUtils.prefixPaths(workspacePath, files)),
//             Paths.MutuallyExclusiveFoldersGroup.map<Array<string>>((files, _, __) => PathUtils.prefixPaths(workspacePath, files)),
//         )))) {// )) && validateUninitializedEsp32pmProj())) {
//             throw Error('The current workspace does contain an ESP32-PM project, but it is not initialized.');
//         }
//     } catch (error) {
//         throw error;
//     }
// }
