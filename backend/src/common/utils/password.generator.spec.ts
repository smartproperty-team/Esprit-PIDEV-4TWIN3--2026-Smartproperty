import { generateTemporaryPassword } from './password.generator';

describe('generateTemporaryPassword', () => {
  it('generates a password of default length 12', () => {
    const password = generateTemporaryPassword();
    expect(password).toHaveLength(12);
  });

  it('generates a password of specified length', () => {
    const password = generateTemporaryPassword(16);
    expect(password).toHaveLength(16);
  });

  it('enforces minimum length of 8', () => {
    const password = generateTemporaryPassword(4);
    expect(password.length).toBeGreaterThanOrEqual(8);
  });

  it('contains at least one uppercase letter', () => {
    const password = generateTemporaryPassword();
    expect(password).toMatch(/[A-Z]/);
  });

  it('contains at least one lowercase letter', () => {
    const password = generateTemporaryPassword();
    expect(password).toMatch(/[a-z]/);
  });

  it('contains at least one number', () => {
    const password = generateTemporaryPassword();
    expect(password).toMatch(/[0-9]/);
  });

  it('contains at least one special character', () => {
    const password = generateTemporaryPassword();
    expect(password).toMatch(/[@$!%*?&]/);
  });

  it('generates unique passwords on each call', () => {
    const passwords = new Set(
      Array.from({ length: 20 }, () => generateTemporaryPassword()),
    );
    expect(passwords.size).toBeGreaterThan(1);
  });
});
