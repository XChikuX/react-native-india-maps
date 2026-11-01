import packageJson from '../../package.json';
import { VERSION } from '../version';

describe('VERSION', () => {
  it('matches the version declared in package.json', () => {
    expect(VERSION).toBe(packageJson.version);
  });
});
