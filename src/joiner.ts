import { join } from "path";

export function joinPaths(...paths: Array<string>): string {
    return join(...paths).replace(/\\/gi, '/');
}