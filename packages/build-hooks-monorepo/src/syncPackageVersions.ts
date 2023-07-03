import path from 'path';
import { updateJson } from './updateJson';

export const syncPackageVersions = (c: any, version: string, versionedPackages: Array<string>) => {
    const v = {
        version: version,
    };
    const pkgFolder = path.join(c.paths.project.dir, 'packages');
    updateJson(c.paths.project.package, v);

    versionedPackages.forEach((pkgName: string) => {
        updateJson(path.join(pkgFolder, pkgName, 'package.json'), v);
    });
};
