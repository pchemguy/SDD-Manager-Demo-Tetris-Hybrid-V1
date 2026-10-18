import type { GameAction } from '../game/types.ts';

/**
 * C4 Keyboard policy (Milestone 1.1 core subset: R09 / A7).
 * Normalizes physical KeyboardEvent.code values for basic movement, soft drop,
 * and start, and determines whether an event target is eligible for gameplay
 * shortcuts. Custom 150 ms / 50 ms held-key repeat and rotation/pause/hold/hard-drop
 * mappings are expanded in Milestones 1.2–1.4.
 */

export interface KeyInputEvent {
  readonly code: string;
  readonly repeat?: boolean;
}

const INELIGIBLE_TAG_NAMES = new Set(['BUTTON', 'INPUT', 'TEXTAREA', 'SELECT']);

/**
 * Returns true when the event target is the game surface/document rather than
 * an interactive lifecycle button or editable element (R09).
 */
export function isEligibleKeyboardTarget(target: unknown): boolean {
  if (!target || typeof target !== 'object') {
    return true;
  }
  const el = target as { tagName?: unknown; isContentEditable?: unknown };
  if (el.isContentEditable === true) {
    return false;
  }
  if (typeof el.tagName === 'string' && INELIGIBLE_TAG_NAMES.has(el.tagName.toUpperCase())) {
    return false;
  }
  return true;
}

/**
 * Maps a physical keydown event to a Milestone 1.1 GameAction, or null when unhandled.
 * Suppresses native browser key repeat on the discrete 'start' (Enter) action (R09).
 */
export function mapKeyDownToAction(event: KeyInputEvent): GameAction | null {
  switch (event.code) {
    case 'Enter':
      return event.repeat ? null : 'start';
    case 'ArrowLeft':
      return 'move-left';
    case 'ArrowRight':
      return 'move-right';
    case 'ArrowDown':
      return 'soft-drop';
    default:
      return null;
  }
}
