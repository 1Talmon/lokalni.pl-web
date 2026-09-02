export enum CameraSource { Camera = 'CAMERA', Photos = 'PHOTOS', Prompt = 'PROMPT' }
export enum CameraResultType { Base64 = 'base64', Uri = 'uri', DataUrl = 'dataUrl' }
export const Camera = { getPhoto: async () => ({ base64String: '', dataUrl: '', path: '', webPath: '', format: 'jpeg', saved: false }) };
