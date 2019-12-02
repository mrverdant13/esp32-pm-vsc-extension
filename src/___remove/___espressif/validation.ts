import * as PathUtils from '../../utils/path';
import * as ValidationUtils from '../../utils/validation';
import * as VscUtils from '../../utils/vsc';


// export async function validateEspressifProj() {
//     try {
//         const workspacePath: string = VscUtils.getWorkspacePath();

//         if (!await ValidationUtils.validate(
//             PathUtils.prefixPaths(workspacePath, Paths.MandatoryFiles),
//             PathUtils.prefixPaths(workspacePath, Paths.MandatoryFolders),
//             Paths.MutuallyExclusiveFilesGroup.map<Array<string>>((files, _, __) => PathUtils.prefixPaths(workspacePath, files)),
//             Paths.MutuallyExclusiveFoldersGroup.map<Array<string>>((files, _, __) => PathUtils.prefixPaths(workspacePath, files)),
//         )) {
//             throw Error('The current workspace does not contain an Espressif project.');
//         }
//     } catch (error) {
//         throw error;
//     }
// }
