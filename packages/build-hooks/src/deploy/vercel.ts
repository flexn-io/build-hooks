import fs from 'fs';
import { Common, Exec, Logger } from 'rnv';
import { notifySlack } from '../slackNotifier';

const { logSuccess, logError } = Logger;

const vercelDeploy = async (config: any) => {
    const { platform, files } = config;
    const isMonorepo = files.project.package.workspaces !== undefined;
    const title = Common.getConfigProp(config, config.platform, 'title');
    const { version } = config.files.project.package;
    const token = config.files.workspace.project?.configPrivate?.vercel?.token;

    // remove .vercel/project.json othwerise it will deploy to the last location
    try {
        fs.unlinkSync(
            `${process.cwd()}${
                isMonorepo ? `/../../` : `/platformBuilds/${config.runtime.appId}_${platform}/`
            }.vercel/project.json`
        );
    } catch (_) {
        // it's deleted most likely
    }

    logSuccess('Vercel deployment started...');

    try {
        const vercelProjectName = Common.getConfigProp(config, config.platform, 'vercelProjectName');

        await Exec.executeAsync(
            config,
            `npx vercel ${
                isMonorepo ? `../../.` : `./platformBuilds/${config.runtime.appId}_${platform}/output`
            } --token=${
                process.env.VERCEL_TOKEN || token
            } --name=${vercelProjectName} --scope=flexn -f --confirm --prod`,
            {
                shell: true,
                stdio: 'inherit',
                silent: false,
            }
        );

        logSuccess(`${platform} succesfully deployed to Vercel`);

        await notifySlack(
            `Deployed *${title}* (*${config.platform}*) *v${version}* ${vercelProjectName}.vercel.app`,
            config
        );
    } catch (e) {
        logError(`Upload failed to Vercel with error: ${e}`);
    }
};

export { vercelDeploy };
