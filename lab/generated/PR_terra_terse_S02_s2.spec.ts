import { test, expect } from '@playwright/test';
import { newUser, apiCall } from '../support/fixtures';

test.describe('Conduit Acceptance Requirements', () => {
  test('@item:S02 Registration with duplicate email', async () => {
    const user = await newUser();

    const response = await apiCall('/users', 'POST', {
      user: {
        username: `${user.username}-duplicate`,
        email: user.email,
        password: 'password123',
      },
    });

    expect(response.status).toBeGreaterThanOrEqual(400);
    expect(response.status).toBeLessThan(500);
    expect(response.json).toHaveProperty('errors');
  });
});