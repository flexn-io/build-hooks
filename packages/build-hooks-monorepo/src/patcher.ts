import { Doctor, FileUtils } from 'rnv';
import merge from 'deepmerge';

export const patchJsonFile = (pPath: string, updateObj: object) => {
    const pObj = FileUtils.readObjectSync(pPath);

    if (!pObj) {
        throw new Error(`patchJsonFile called with unresolveable package.json path '${pPath}'`);
    }

    let obj;
    if (pObj) {
        obj = merge(pObj, updateObj);
    }
    const output = Doctor.fixPackageObject(obj);
    FileUtils.writeFileSync(pPath, output, 4, true);
};
