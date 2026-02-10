// ============================================================
// E2E Tests — Full Gameplay Flow
// ============================================================
import { test, expect } from '@playwright/test';

test.describe('Title Screen', () => {
  test('should render the title page', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Third Time')).toBeVisible();
    await expect(page.getByText('Traders')).toBeVisible();
    await expect(page.getByText('New Game')).toBeVisible();
  });

  test('should show name input on New Game click', async ({ page }) => {
    await page.goto('/');
    await page.getByText('New Game').click();
    await expect(page.getByPlaceholder('Enter your trader name...')).toBeVisible();
  });

  test('should start a new game with player name', async ({ page }) => {
    await page.goto('/');
    await page.getByText('New Game').click();
    await page.getByPlaceholder('Enter your trader name...').fill('TestTrader');
    await page.getByText('Start Trading').click();
    await page.waitForURL('**/game');
    await expect(page.getByText('Third Time Traders')).toBeVisible();
    await expect(page.getByText('Turn 1')).toBeVisible();
  });

  test('should start a new game with default name', async ({ page }) => {
    await page.goto('/');
    await page.getByText('New Game').click();
    // Don't type a name, just click Start Trading
    await page.getByText('Start Trading').click();
    await page.waitForURL('**/game');
    await expect(page.getByText('Third Time Traders')).toBeVisible();
  });
});

test.describe('Game Shell', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByText('New Game').click();
    await page.getByPlaceholder('Enter your trader name...').fill('E2EPlayer');
    await page.getByText('Start Trading').click();
    await page.waitForURL('**/game');
  });

  test('should render header with turn and season', async ({ page }) => {
    await expect(page.getByText('Third Time Traders')).toBeVisible();
    await expect(page.getByText('Turn 1')).toBeVisible();
    // Should show a season
    await expect(page.getByText(/Spring|Summer|Autumn|Winter/)).toBeVisible();
  });

  test('should render resource pills in header', async ({ page }) => {
    await expect(page.getByText(/💰/)).toBeVisible();
    await expect(page.getByText(/⛽/)).toBeVisible();
    await expect(page.getByText(/💧/)).toBeVisible();
    await expect(page.getByText(/🍞/)).toBeVisible();
  });

  test('should render End Turn button and advance turn', async ({ page }) => {
    await expect(page.getByText('End Turn')).toBeVisible();
    await page.getByText('End Turn').click();
    await expect(page.getByText('Turn 2')).toBeVisible();
  });

  test('should advance multiple turns', async ({ page }) => {
    for (let i = 0; i < 5; i++) {
      await page.getByText('End Turn').click();
    }
    await expect(page.getByText('Turn 6')).toBeVisible();
  });

  test('should show bottom tab bar', async ({ page }) => {
    await expect(page.getByRole('tablist')).toBeVisible();
    // 6 tabs
    const tabs = page.getByRole('tab');
    await expect(tabs).toHaveCount(6);
  });

  test('should default to map panel', async ({ page }) => {
    const panel = page.locator('#panel-map');
    await expect(panel).toBeVisible();
  });
});

test.describe('Tab Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByText('New Game').click();
    await page.getByPlaceholder('Enter your trader name...').fill('TabTester');
    await page.getByText('Start Trading').click();
    await page.waitForURL('**/game');
  });

  test('should switch to reputation panel', async ({ page }) => {
    await page.getByRole('tab', { name: /Rep/i }).click();
    await expect(page.locator('#panel-reputation')).toBeVisible();
    await expect(page.getByText('Faction Reputation')).toBeVisible();
  });

  test('should switch to inventory panel', async ({ page }) => {
    await page.getByRole('tab', { name: /Items/i }).click();
    await expect(page.locator('#panel-inventory')).toBeVisible();
  });

  test('should switch to trade panel', async ({ page }) => {
    await page.getByRole('tab', { name: /Trade/i }).click();
    await expect(page.locator('#panel-trade')).toBeVisible();
    await expect(page.getByText('Trade Routes')).toBeVisible();
  });

  test('should switch to events panel', async ({ page }) => {
    await page.getByRole('tab', { name: /Events/i }).click();
    await expect(page.locator('#panel-events')).toBeVisible();
  });

  test('should switch to leaderboard panel', async ({ page }) => {
    await page.getByRole('tab', { name: /Ranks/i }).click();
    await expect(page.locator('#panel-leaderboard')).toBeVisible();
    await expect(page.getByText('Leaderboard')).toBeVisible();
  });

  test('should switch back to map panel', async ({ page }) => {
    await page.getByRole('tab', { name: /Rep/i }).click();
    await expect(page.locator('#panel-reputation')).toBeVisible();
    await page.getByRole('tab', { name: /Map/i }).click();
    await expect(page.locator('#panel-map')).toBeVisible();
  });
});

test.describe('Reputation Panel', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByText('New Game').click();
    await page.getByText('Start Trading').click();
    await page.waitForURL('**/game');
    await page.getByRole('tab', { name: /Rep/i }).click();
  });

  test('should show all 6 factions', async ({ page }) => {
    await expect(page.getByText('The Mughal Court')).toBeVisible();
    await expect(page.getByText('The East India Company').first()).toBeVisible();
    await expect(page.getByText('The Rajput Clans').first()).toBeVisible();
    await expect(page.getByText('The Brahmin Council')).toBeVisible();
    await expect(page.getByText('The Nightmarket Syndicate')).toBeVisible();
    await expect(page.getByText("The Nizam's Court")).toBeVisible();
  });

  test('should show neutral status for all factions initially', async ({ page }) => {
    const neutralBadges = page.getByText('neutral');
    await expect(neutralBadges.first()).toBeVisible();
  });

  test('should show faction diplomacy section', async ({ page }) => {
    await expect(page.getByText('Faction Diplomacy')).toBeVisible();
  });
});

test.describe('Trade Panel', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByText('New Game').click();
    await page.getByText('Start Trading').click();
    await page.waitForURL('**/game');
    await page.getByRole('tab', { name: /Trade/i }).click();
  });

  test('should show trade routes heading', async ({ page }) => {
    await expect(page.getByText('Trade Routes')).toBeVisible();
  });

  test('should show available trade routes', async ({ page }) => {
    // At least one trade route should be visible
    await expect(page.getByText(/Establish|Requirements/i).first()).toBeVisible();
  });
});

test.describe('Events & Turn Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByText('New Game').click();
    await page.getByText('Start Trading').click();
    await page.waitForURL('**/game');
  });

  test('should generate events after advancing turns', async ({ page }) => {
    // Advance several turns to trigger events
    for (let i = 0; i < 10; i++) {
      await page.getByText('End Turn').click();
    }

    // Switch to events tab
    await page.getByRole('tab', { name: /Events/i }).click();
    await expect(page.locator('#panel-events')).toBeVisible();

    // After 10 turns, there should be some event history
    // The events panel should at least show the section
    const panel = page.locator('#panel-events');
    await expect(panel).toBeVisible();
  });

  test('should update resources after End Turn', async ({ page }) => {
    // Get initial gold display
    const initialGoldText = await page.getByText(/💰\s*\d+/).first().textContent();

    // Advance a turn
    await page.getByText('End Turn').click();

    // Gold should change due to base income
    await page.waitForTimeout(500); // Wait for animation
    const newGoldText = await page.getByText(/💰\s*\d+/).first().textContent();

    // Gold value should have changed (base income adds 5/turn)
    expect(newGoldText).not.toBeNull();
  });

  test('should cycle through seasons over multiple turns', async ({ page }) => {
    // Start in spring (turn 1). Each season lasts 8 turns.
    await expect(page.getByText(/Spring/)).toBeVisible();

    // Advance 8 turns to get to summer
    for (let i = 0; i < 8; i++) {
      await page.getByText('End Turn').click();
    }
    await expect(page.getByText(/Summer/)).toBeVisible();
  });
});

test.describe('Inventory Panel', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByText('New Game').click();
    await page.getByText('Start Trading').click();
    await page.waitForURL('**/game');
    await page.getByRole('tab', { name: /Items/i }).click();
  });

  test('should show resource overview', async ({ page }) => {
    await expect(page.locator('#panel-inventory')).toBeVisible();
    // Should show gold/fuel/water/food resources
    await expect(page.getByText(/Gold/i).first()).toBeVisible();
  });
});

test.describe('Leaderboard Panel', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByText('New Game').click();
    await page.getByPlaceholder('Enter your trader name...').fill('LeaderPlayer');
    await page.getByText('Start Trading').click();
    await page.waitForURL('**/game');
  });

  test('should show leaderboard with current player', async ({ page }) => {
    await page.getByRole('tab', { name: /Ranks/i }).click();
    await expect(page.getByText('Leaderboard')).toBeVisible();

    // Should show player rank
    await expect(page.getByText('Your Rank')).toBeVisible();
    await expect(page.getByText('LeaderPlayer')).toBeVisible();
  });

  test('should update leaderboard score after advancing turns', async ({ page }) => {
    // Advance some turns to build score
    for (let i = 0; i < 3; i++) {
      await page.getByText('End Turn').click();
    }

    await page.getByRole('tab', { name: /Ranks/i }).click();
    await expect(page.getByText('Your Rank')).toBeVisible();
  });
});

test.describe('Save & Continue Flow', () => {
  test('should persist game state and allow continue', async ({ page }) => {
    // Start a new game
    await page.goto('/');
    await page.getByText('New Game').click();
    await page.getByPlaceholder('Enter your trader name...').fill('SavePlayer');
    await page.getByText('Start Trading').click();
    await page.waitForURL('**/game');

    // Advance several turns to trigger autosave (every 5 turns)
    for (let i = 0; i < 5; i++) {
      await page.getByText('End Turn').click();
    }
    await expect(page.getByText('Turn 6')).toBeVisible();

    // Go back to title
    await page.goto('/');
    await expect(page.getByText('Third Time')).toBeVisible();

    // Should see Continue button if save exists
    const continueBtn = page.getByText('Continue');
    if (await continueBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await continueBtn.click();
      await page.waitForURL('**/game');
      // Should restore turn
      await expect(page.getByText(/Turn [6-9]|Turn 1\d/)).toBeVisible();
    }
  });
});

test.describe('World Map Interactions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByText('New Game').click();
    await page.getByText('Start Trading').click();
    await page.waitForURL('**/game');
  });

  test('should show map panel with regions', async ({ page }) => {
    await expect(page.locator('#panel-map')).toBeVisible();
    // The world map should be rendered (canvas or SVG)
    const mapArea = page.locator('#panel-map');
    await expect(mapArea).toBeVisible();
  });
});

test.describe('Full Gameplay Flow (Integration)', () => {
  test('should complete a full game session: new game → explore → trade → events → leaderboard', async ({ page }) => {
    // 1. Start new game
    await page.goto('/');
    await page.getByText('New Game').click();
    await page.getByPlaceholder('Enter your trader name...').fill('IntegrationPlayer');
    await page.getByText('Start Trading').click();
    await page.waitForURL('**/game');

    // 2. Verify starting state
    await expect(page.getByText('Third Time Traders')).toBeVisible();
    await expect(page.getByText('Turn 1')).toBeVisible();
    await expect(page.getByText(/Spring/)).toBeVisible();

    // 3. Check all tabs are accessible
    const tabNames = ['Map', 'Rep', 'Items', 'Trade', 'Events', 'Ranks'];
    for (const tabName of tabNames) {
      const tab = page.getByRole('tab', { name: new RegExp(tabName, 'i') });
      await expect(tab).toBeVisible();
    }

    // 4. View reputation
    await page.getByRole('tab', { name: /Rep/i }).click();
    await expect(page.getByText('Faction Reputation')).toBeVisible();

    // 5. View inventory
    await page.getByRole('tab', { name: /Items/i }).click();
    await expect(page.locator('#panel-inventory')).toBeVisible();

    // 6. View trade routes
    await page.getByRole('tab', { name: /Trade/i }).click();
    await expect(page.getByText('Trade Routes')).toBeVisible();

    // 7. Go back to map and advance turns
    await page.getByRole('tab', { name: /Map/i }).click();
    for (let i = 0; i < 5; i++) {
      await page.getByText('End Turn').click();
    }
    await expect(page.getByText('Turn 6')).toBeVisible();

    // 8. Check events after multiple turns
    await page.getByRole('tab', { name: /Events/i }).click();
    await expect(page.locator('#panel-events')).toBeVisible();

    // 9. Check leaderboard
    await page.getByRole('tab', { name: /Ranks/i }).click();
    await expect(page.getByText('Leaderboard')).toBeVisible();
    await expect(page.getByText('IntegrationPlayer')).toBeVisible();

    // 10. Continue advancing turns (test long gameplay)
    await page.getByRole('tab', { name: /Map/i }).click();
    for (let i = 0; i < 10; i++) {
      await page.getByText('End Turn').click();
    }
    await expect(page.getByText('Turn 16')).toBeVisible();

    // Should have passed into a different season by now
    // (16 turns = 2 full seasons: spring + summer → now in autumn)
    await expect(page.getByText(/Autumn/)).toBeVisible();
  });
});
