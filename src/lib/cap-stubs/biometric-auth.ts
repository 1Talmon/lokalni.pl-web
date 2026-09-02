export enum BiometryType { none = 0, touchId = 1, faceId = 2, fingerprintAuthentication = 3, faceAuthentication = 4, irisAuthentication = 5 }
export enum BiometryErrorType { none = '', appCancel = 'appCancel', authenticationFailed = 'authenticationFailed', invalidContext = 'invalidContext', notAvailable = 'notAvailable', notEnrolled = 'notEnrolled', passcodeNotSet = 'passcodeNotSet', systemCancel = 'systemCancel', userCancel = 'userCancel', userFallback = 'userFallback', biometryLockout = 'biometryLockout', biometryNotAvailable = 'biometryNotAvailable', biometryNotEnrolled = 'biometryNotEnrolled', noDeviceCredential = 'noDeviceCredential' }
export class BiometricAuth {
    static async checkBiometry() { return { isAvailable: false, biometryType: BiometryType.none, reason: '', strongBiometryIsAvailable: false, deviceIsSecure: false, biometryTypes: [] }; }
    static async authenticate(_opts?: unknown) { throw new Error('Not available on web'); }
    static async addResumeListener(_handler?: unknown) { return { remove: async () => {} }; }
}
