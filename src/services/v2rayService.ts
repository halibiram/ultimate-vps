/**
 * @file Provides an abstraction layer for managing the v2ray service.
 * @description This service class encapsulates the shell commands required to install,
 * uninstall, enable, disable, and check the status of the x-ui panel.
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as pty from 'node-pty';

const execAsync = promisify(exec);

/**
 * Represents the status of the V2Ray service.
 * @typedef {('Not Installed' | 'Active' | 'Inactive' | 'Unknown')} V2RayStatus
 */
export type V2RayStatus = 'Not Installed' | 'Active' | 'Inactive' | 'Unknown';


/**
 * @class V2RayService
 * @description Manages the x-ui service by executing shell commands.
 */
export class V2RayService {
    private xuiCmd = '/usr/bin/x-ui';

    /**
     * Executes a command with sudo privileges.
     * @param command The command to execute.
     * @returns A promise that resolves with the stdout and stderr of the command.
     */
    private async execSudo(command: string): Promise<{ stdout: string; stderr: string }> {
        return execAsync(`sudo ${command}`);
    }

    /**
     * Installs the x-ui panel using the official script.
     * This method uses node-pty to handle the interactive prompts of the script.
     * @returns A promise that resolves to true if the installation was successful.
     */
    async install(): Promise<boolean> {
        return new Promise((resolve, reject) => {
            const shell = 'bash';
            const args = ['-c', `"$(curl -Ls https://raw.githubusercontent.com/vaxilu/x-ui/master/install.sh)"`];
            const ptyProcess = pty.spawn(shell, args, {
                name: 'xterm-color',
                cols: 80,
                rows: 30,
                cwd: process.env.HOME,
                env: process.env
            });

            let output = '';
            ptyProcess.onData((data) => {
                output += data;
                console.log(data); // Log output for debugging

                // Automate responses to prompts
                if (output.includes('确认是否继续?[y/n]')) {
                    ptyProcess.write('y\r');
                } else if (output.includes('请设置您的账户名:')) {
                    ptyProcess.write('admin\r');
                } else if (output.includes('请设置您的账户密码:')) {
                    ptyProcess.write('password\r');
                } else if (output.includes('请设置面板访问端口:')) {
                    ptyProcess.write('54321\r');
                }
            });

            ptyProcess.onExit(({ exitCode }) => {
                if (exitCode === 0) {
                    console.log('x-ui installed successfully.');
                    resolve(true);
                } else {
                    console.error('Failed to install x-ui.');
                    reject(new Error('Failed to install x-ui.'));
                }
            });
        });
    }

    /**
     * Uninstalls the x-ui panel.
     * @returns A promise that resolves to true if the uninstallation was successful.
     */
    async uninstall(): Promise<boolean> {
        try {
            // The x-ui command provides an uninstall option.
            await this.execSudo(`${this.xuiCmd} uninstall`);
            console.log('x-ui uninstalled successfully.');
            return true;
        } catch (error) {
            console.error('Failed to uninstall x-ui:', error);
            try {
                await fs.access(this.xuiCmd);
                return false;
            } catch (fsError) {
                return true;
            }
        }
    }

    /**
     * Enables and starts the x-ui service.
     * @returns A promise that resolves to true if the service was enabled successfully.
     */
    async enable(): Promise<boolean> {
        try {
            await this.execSudo('systemctl enable --now x-ui');
            console.log('x-ui service enabled.');
            return true;
        } catch (error) {
            console.error('Failed to enable x-ui service:', error);
            return false;
        }
    }

    /**
     * Disables and stops the x-ui service.
     * @returns A promise that resolves to true if the service was disabled successfully.
     */
    async disable(): Promise<boolean> {
        try {
            await this.execSudo('systemctl disable --now x-ui');
            console.log('x-ui service disabled.');
            return true;
        } catch (error) {
            console.error('Failed to disable x-ui service:', error);
            return false;
        }
    }

    /**
     * Checks the status of the V2Ray (x-ui) service.
     * @returns {Promise<V2RayStatus>} The current status of the service.
     */
    async getStatus(): Promise<V2RayStatus> {
        try {
            await fs.access(this.xuiCmd);
        } catch (error) {
            return 'Not Installed';
        }

        try {
            const { stdout } = await this.execSudo('systemctl is-active x-ui');
            if (stdout.trim() === 'active') {
                return 'Active';
            } else {
                return 'Inactive';
            }
        } catch (error) {
            return 'Inactive';
        }
    }
}
