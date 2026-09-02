export enum ImpactStyle { Heavy = 'HEAVY', Medium = 'MEDIUM', Light = 'LIGHT' }
export enum NotificationType { Success = 'SUCCESS', Warning = 'WARNING', Error = 'ERROR' }
export const Haptics = {
    impact: async (_opts?: { style?: ImpactStyle }) => {},
    notification: async (_opts?: { type?: NotificationType }) => {},
    vibrate: async (_opts?: { duration?: number }) => {},
};
