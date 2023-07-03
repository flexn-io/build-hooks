import path from 'path';
import fs from 'fs';
import { FileUtils } from 'rnv';
const { readObjectSync } = FileUtils;

const parseRenativeProject = (dirPath: string) => {
    const conf: any = {};

    if (fs.statSync(dirPath).isDirectory()) {
        const _pkgPath = path.join(dirPath, 'package.json');
        if (fs.existsSync(_pkgPath)) {
            conf.pkgFile = readObjectSync(_pkgPath);
            conf.pkgPath = _pkgPath;
            conf.pkgName = conf.pkgFile.name;
        }
        const _rnvPath = path.join(dirPath, 'renative.json');
        if (fs.existsSync(_rnvPath)) {
            conf.rnvPath = _rnvPath;
            conf.rnvFile = readObjectSync(_rnvPath);
        }
        const _metaPath = path.join(dirPath, 'metadata.json');
        if (fs.existsSync(_metaPath)) {
            conf.metaPath = _metaPath;
            conf.metaFile = readObjectSync(_metaPath);
        }
        const _plugTempPath = path.join(dirPath, '/pluginTemplates/renative.plugins.json');
        if (fs.existsSync(_plugTempPath)) {
            conf.plugTempPath = _plugTempPath;
            conf.plugTempFile = readObjectSync(_plugTempPath);
        }

        const _templateConfigPath = path.join(dirPath, 'renative.template.json');
        if (fs.existsSync(_templateConfigPath)) {
            conf.templateConfigPath = _templateConfigPath;
            conf.templateConfigFile = readObjectSync(_templateConfigPath);
        }
    }
    return conf;
};

export const parseRenativeProjects = (packagesDirs: string[], projectDirs?: string[]) => {
    const packageNamesAll: any = [];
    const packageConfigs: any = {};

    packagesDirs.forEach((pkgDirPath) => {
        const dirs = fs.readdirSync(pkgDirPath);

        dirs.forEach((dir) => {
            const conf = parseRenativeProject(path.join(pkgDirPath, dir));
            packageConfigs[conf.pkgName] = conf;
            packageNamesAll.push(conf.pkgName);
        });
    });
    if (projectDirs) {
        projectDirs.forEach((projectDir) => {
            const conf = parseRenativeProject(projectDir);
            packageConfigs[conf.pkgName] = conf;
            packageNamesAll.push(conf.pkgName);
        });
    }

    // return {
    //     packageNamesAsArray: packageNamesAll,
    //     configs: packageConfigs,
    // };
    return packageConfigs;
};
