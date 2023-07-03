import path from 'path';
import fs from 'fs';
import { Doctor, FileUtils } from 'rnv';
const { readObjectSync } = FileUtils;

export const syncDependencies = (pkgConfig, depKey, packageNamesAll, packageConfigs, semVer = '') => {
    const { pkgFile, rnvFile } = pkgConfig;

    packageNamesAll.forEach((v) => {
        if (pkgFile) {
            let hasChanges = false;
            const currVer = pkgFile?.[depKey]?.[v];
            if (currVer) {
                const newVer = `${semVer}${packageConfigs[v].pkgFile?.version}`;

                if (currVer !== newVer) {
                    console.log('Found linked dependency to update:', v, currVer, newVer);
                    hasChanges = true;
                    pkgFile[depKey][v] = newVer;
                }
            }
            if (hasChanges) {
                const output = Doctor.fixPackageObject(pkgFile);
                FileUtils.writeFileSync(pkgConfig.pkgPath, output, 4, true);
            }
        }
        if (rnvFile) {
            let hasRnvChanges = false;
            const templateVer = rnvFile?.templates?.[v]?.version;
            if (templateVer) {
                const newVer = `${semVer}${packageConfigs[v].pkgFile?.version}`;
                if (templateVer !== newVer) {
                    console.log('Found linked plugin dependency to update:', v, templateVer, newVer);
                    hasRnvChanges = true;
                    rnvFile.templates[v].version = newVer;
                }
            }
            if (hasRnvChanges) {
                const output = Doctor.fixPackageObject(rnvFile);
                FileUtils.writeFileSync(pkgConfig.rnvPath, output, 4, true);
            }
        }
    });
};
