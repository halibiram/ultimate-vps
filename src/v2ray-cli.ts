/**
 * @file Command-line interface for managing the V2Ray service.
 */

import { V2RayService } from './services/v2rayService';

const v2rayService = new V2RayService();

async function main() {
    const command = process.argv[2];

    if (!command) {
        console.error('Please provide a command: install, uninstall, enable, disable, status');
        process.exit(1);
    }

    switch (command) {
        case 'install':
            console.log('Installing V2Ray (x-ui)...');
            await v2rayService.install();
            break;
        case 'uninstall':
            console.log('Uninstalling V2Ray (x-ui)...');
            await v2rayService.uninstall();
            break;
        case 'enable':
            console.log('Enabling V2Ray (x-ui)...');
            await v2rayService.enable();
            break;
        case 'disable':
            console.log('Disabling V2Ray (x-ui)...');
            await v2rayService.disable();
            break;
        case 'status':
            const status = await v2rayService.getStatus();
            console.log(`V2Ray (x-ui) status: ${status}`);
            break;
        default:
            console.error(`Unknown command: ${command}`);
            process.exit(1);
    }
}

main().catch(error => {
    console.error('An error occurred:', error);
    process.exit(1);
});
