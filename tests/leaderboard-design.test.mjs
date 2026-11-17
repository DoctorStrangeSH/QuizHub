import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const leaderboard = readFileSync(new URL('../app/modules/leaderboard/leaderboard.js', import.meta.url), 'utf8');
const sourceGate = readFileSync(new URL('../app/modules/profile/profile-read-source.js', import.meta.url), 'utf8');
const styles = readFileSync(new URL('../app/styles/midnight-arcade.css', import.meta.url), 'utf8');

test('rankings use the unified arena identity and highlight the podium', () => {
  assert.ok(!leaderboard.includes('Quiz Empire'));
  assert.ok(leaderboard.includes('arcade-mark'));
  assert.ok(leaderboard.includes('collection-eyebrow'));
  assert.ok(leaderboard.includes('rank-'));
  assert.ok(leaderboard.includes('bi-trophy-fill'));
  for (const rank of [1,2,3]) assert.ok(styles.includes('.leaderboard-item.rank-' + rank));
});

test('profile selection uses delegated click and keyboard handling', () => {
  assert.ok(leaderboard.includes('data-profile-id='));
  assert.ok(leaderboard.includes('role="button" tabindex="0"'));
  assert.ok(leaderboard.includes("list?.addEventListener('click', openRankedProfile)"));
  assert.ok(leaderboard.includes("list?.addEventListener('keydown', openRankedProfile)"));
  assert.ok(leaderboard.includes("event.key !== 'Enter'"));
  assert.ok(!leaderboard.includes("onclick=\"window.viewProfile("));
});

test('rankings preserve public projection, guarded rollout and responsive styles', () => {
  assert.ok(leaderboard.includes('projectDirectoryProfile'));
  assert.ok(sourceGate.includes('PUBLIC_PROFILE_READS_ENABLED = false'));
  assert.ok(leaderboard.includes('directoryCollection()'));
  assert.ok(leaderboard.includes('escapeHTML(leader.nickname'));
  assert.ok(styles.includes('.leaderboard-item.current-user'));
  assert.match(styles, /@media \(max-width: 560px\)/);
  assert.match(styles, /prefers-reduced-motion: reduce/);
});
