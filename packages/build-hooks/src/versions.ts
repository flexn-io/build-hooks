import path from 'path';
import fs from 'fs';
import { Doctor, FileUtils, Logger, Exec } from 'rnv';

const { readObjectSync, writeFileSync } = FileUtils;
const { logHook } = Logger;

const EXTERNAL_RNV_DEPENDENCIES = ['@flexn/plugins'];

const updateDeps = (
    pkgConfig: any,
    depKey: string,
    packageNamesAll: Array<string>,
    packageConfigs: any,
    semVer = ''
) => {
    const { pkgFile } = pkgConfig;

    packageNamesAll.forEach((v) => {
        if (pkgFile) {
            let hasChanges = false;
            const currVer = pkgFile?.[depKey]?.[v];
            if (currVer) {
                const newVer = `${semVer}${packageConfigs[v].pkgFile?.version}`;

                if (currVer !== newVer) {
                    //eslint-disable-next-line no-console
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
    });
};

const updateRnvDeps = (pkgConfig: any, packageNamesAll: Array<string>, packageConfigs: any, semVer = '') => {
    const {
        rnvFile,
        pkgFile,
        metaFile,
        rnvPath,
        metaPath,
        plugTempFile,
        plugTempPath,
        templateConfigFile,
        templateConfigPath,
    } = pkgConfig;

    packageNamesAll.forEach((v) => {
        const newVer = `${semVer}${packageConfigs[v].pkgFile?.version}`;
        if (rnvFile) {
            let hasRnvChanges = false;
            const templateVer = rnvFile?.templates?.[v]?.version;

            if (templateVer) {
                if (templateVer !== newVer) {
                    //eslint-disable-next-line no-console
                    console.log('Found linked plugin dependency to update:', v, templateVer, newVer);
                    hasRnvChanges = true;
                    rnvFile.templates[v].version = newVer;
                }
            }

            const rnvPlugin = rnvFile.plugins[v];
            if (rnvPlugin?.version) {
                rnvPlugin.version = `${newVer}`;
                hasRnvChanges = true;
            } else if (rnvPlugin) {
                if (!rnvPlugin.startsWith('source')) {
                    rnvFile.plugins[v] = newVer;
                    hasRnvChanges = true;
                }
            }

            if (hasRnvChanges) {
                const output = Doctor.fixPackageObject(rnvFile);
                FileUtils.writeFileSync(rnvPath, output, 4, true);
            }
        }

        if (metaFile) {
            metaFile.version = pkgFile.version;
            const output = Doctor.fixPackageObject(metaFile);
            writeFileSync(metaPath, output);
        }

        if (plugTempFile) {
            let hasChanges = false;
            const rnvPlugin = plugTempFile.pluginTemplates[v];
            if (rnvPlugin?.version) {
                rnvPlugin.version = `${newVer}`;
                hasChanges = true;
            } else if (rnvPlugin) {
                rnvFile.plugins[v] = newVer;
                hasChanges = true;
            }

            if (hasChanges) {
                const output = Doctor.fixPackageObject(plugTempFile);
                FileUtils.writeFileSync(plugTempPath, output, 4, true);
            }
        }

        if (templateConfigFile) {
            // leaving it for future packages that would need it
            updateTemplateConfigDeps(templateConfigFile, templateConfigPath, v, newVer);
        }
    });
};

const updateTemplateConfigDeps = (
    templateConfigFile: any,
    templateConfigPath: string,
    pkg: string,
    version: string
) => {
    let hasTemplateChanges = false;
    const packageTemplateDep = templateConfigFile.templateConfig?.packageTemplate?.dependencies;
    const packageTemplateDevDep = templateConfigFile.templateConfig?.packageTemplate?.devDependencies;

    if (packageTemplateDep?.[pkg] && packageTemplateDep[pkg] !== version) {
        packageTemplateDep[pkg] = version;
        hasTemplateChanges = true;
    }
    if (packageTemplateDevDep?.[pkg] && packageTemplateDevDep[pkg] !== version) {
        packageTemplateDevDep[pkg] = version;
        hasTemplateChanges = true;
    }

    if (hasTemplateChanges) {
        const output = Doctor.fixPackageObject(templateConfigFile);
        FileUtils.writeFileSync(templateConfigPath, output, 4, true);
    }
};

const updateExternalDeps = (pkgConfig: any, externalDependenciesVersions: Record<string, string>) => {
    const { templateConfigFile, templateConfigPath } = pkgConfig;
    if (templateConfigFile) {
        Object.keys(externalDependenciesVersions).forEach((v) => {
            updateTemplateConfigDeps(templateConfigFile, templateConfigPath, v, externalDependenciesVersions[v]);
        });
    }
};

export const updateVersions = async (c: any) => {
    const pkgDirPath = path.join(c.paths.project.dir, 'packages');
    const dirs = fs.readdirSync(pkgDirPath);

    const packageNamesAll: any = [];
    const packageConfigs: any = {};
    const externalDependenciesVersions: any = {};

    if (EXTERNAL_RNV_DEPENDENCIES) {
        // get latest versions for external dependencies
        await Promise.all(
            EXTERNAL_RNV_DEPENDENCIES.map(async (v) => {
                const latestPkgVersion = JSON.parse(await Exec.executeAsync(`npm show ${v} versions --json`)).pop();
                externalDependenciesVersions[v] = latestPkgVersion;
            })
        );
    }

    const parsePackages = (dirPath: string) => {
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
        packageConfigs[conf.pkgName] = conf;
        packageNamesAll.push(conf.pkgName);
    };

    parsePackages(c.paths.project.dir);

    dirs.forEach((dir) => {
        parsePackages(path.join(pkgDirPath, dir));
    });

    packageNamesAll.forEach((pkgName: string) => {
        const pkgConfig = packageConfigs[pkgName];
        updateDeps(pkgConfig, 'dependencies', packageNamesAll, packageConfigs);
        updateDeps(pkgConfig, 'devDependencies', packageNamesAll, packageConfigs);
        updateDeps(pkgConfig, 'optionalDependencies', packageNamesAll, packageConfigs);
        updateDeps(pkgConfig, 'peerDependencies', packageNamesAll, packageConfigs, '^');
        updateRnvDeps(pkgConfig, packageNamesAll, packageConfigs);
        updateExternalDeps(pkgConfig, externalDependenciesVersions);
    });
};

export const prePublish = async (c: any) => {
    logHook('bump plugins');
    await updateVersions(c);
    return true;
};
