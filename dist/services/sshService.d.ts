export declare class SSHService {
    createSSHUser(username: string, password: string): Promise<boolean>;
    deleteSSHUser(username: string): Promise<boolean>;
    toggleUserLock(username: string, lock: boolean): Promise<boolean>;
    getUserConnections(username: string): Promise<number>;
    getActiveConnections(): Promise<any[]>;
    getServerStats(): Promise<any>;
}
//# sourceMappingURL=sshService.d.ts.map