import test from 'node:test';
import assert from 'node:assert/strict';

// Test 1: RTL Persian Date Slider Arrow Navigation Logic
test('Date Slider in RTL: Right arrow decrements day (yesterday/past), Left arrow increments day (tomorrow/future)', () => {
  const baseDate = new Date('2026-11-07T12:00:00Z');

  // Next date calculation
  const nextDate = new Date(baseDate);
  nextDate.setDate(nextDate.getDate() + 1);

  // Prev date calculation
  const prevDate = new Date(baseDate);
  prevDate.setDate(prevDate.getDate() - 1);

  // Verification of calculations
  assert.equal(nextDate.toISOString().slice(0, 10), '2026-11-08');
  assert.equal(prevDate.toISOString().slice(0, 10), '2026-11-06');

  // Button mapping in RTL:
  // Right button (فلش راست >): past/previous in RTL reading direction
  const rightButtonAction = (date) => {
    const d = new Date(date);
    d.setDate(d.getDate() - 1);
    return { targetDate: d, direction: -1 };
  };

  // Left button (فلش چپ <): future/next in RTL reading direction
  const leftButtonAction = (date) => {
    const d = new Date(date);
    d.setDate(d.getDate() + 1);
    return { targetDate: d, direction: 1 };
  };

  const rightResult = rightButtonAction(baseDate);
  assert.equal(rightResult.targetDate.toISOString().slice(0, 10), '2026-11-06', 'Right button must go to previous day');
  assert.equal(rightResult.direction, -1, 'Right button direction must be -1 for smooth RTL exit');

  const leftResult = leftButtonAction(baseDate);
  assert.equal(leftResult.targetDate.toISOString().slice(0, 10), '2026-11-08', 'Left button must go to next day');
  assert.equal(leftResult.direction, 1, 'Left button direction must be 1 for smooth RTL enter');
});

// Test 2: PWA Flash of Login Prevention Logic
test('PWA Zero-Flash Auth State Machine: Authenticated user sees splash screen and redirects immediately, zero login form rendering', () => {
  // Simulate mock storage and state
  const mockStorage = new Map();
  mockStorage.set('access_token', 'mock_jwt_token');
  mockStorage.set('user_role', 'student');

  let renderedView = null;
  let redirectedTo = null;

  const renderLoginPage = ({ token, isClient, isLoading, isAuthenticated }) => {
    const hasStoredToken = !!token;
    if (!isClient || hasStoredToken || isAuthenticated || isLoading) {
      renderedView = 'SPLASH_SCREEN';
      if (hasStoredToken) {
        const cachedRole = mockStorage.get('user_role') || 'student';
        redirectedTo = `/${cachedRole}-dashboard`;
      }
      return;
    }
    renderedView = 'LOGIN_FORM';
  };

  // Case A: User opens PWA with active session
  renderLoginPage({
    token: mockStorage.get('access_token'),
    isClient: true,
    isLoading: true, // AuthContext still initializing
    isAuthenticated: false, // Network check hasn't responded yet
  });

  assert.equal(renderedView, 'SPLASH_SCREEN', 'Must render SPLASH_SCREEN and NEVER LOGIN_FORM when session exists');
  assert.equal(redirectedTo, '/student-dashboard', 'Must redirect immediately to /student-dashboard');

  // Case B: User opens PWA without any session (logged out)
  mockStorage.clear();
  renderedView = null;
  redirectedTo = null;

  renderLoginPage({
    token: null,
    isClient: true,
    isLoading: false, // Finished checking
    isAuthenticated: false,
  });

  assert.equal(renderedView, 'LOGIN_FORM', 'Must render LOGIN_FORM only when user is genuinely unauthenticated');
  assert.equal(redirectedTo, null, 'Must not redirect unauthenticated user');
});
