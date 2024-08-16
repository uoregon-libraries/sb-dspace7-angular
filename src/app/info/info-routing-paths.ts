import { getInfoModulePath } from '../app-routing-paths';

export const END_USER_AGREEMENT_PATH = 'end-user-agreement';
export const PRIVACY_PATH = 'privacy';
export const FEEDBACK_PATH = 'feedback';
export const CONTACTUS_PATH = 'contactus';
export const ABOUT_PATH = 'about';

export function getEndUserAgreementPath() {
    return getSubPath(END_USER_AGREEMENT_PATH);
}

export function getPrivacyPath() {
    return getSubPath(PRIVACY_PATH);
}

export function getFeedbackPath() {
    return getSubPath(FEEDBACK_PATH);
}

export function getContactusPath() {
    return getSubPath(CONTACTUS_PATH);
}

export function getAboutPath() {
    return getSubPath(ABOUT_PATH);
}

function getSubPath(path: string) {
    return `${getInfoModulePath()}/${path}`;
}
