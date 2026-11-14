import { stopXvfb } from './global-setup';

const globalTeardown = (): void => {
    stopXvfb();
};

export default globalTeardown;
