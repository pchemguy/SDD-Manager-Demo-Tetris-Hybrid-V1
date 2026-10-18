import { describe, expect, it } from 'vitest';
import { isEligibleKeyboardTarget, mapKeyDownToAction } from '../../src/browser/keyboard.ts';

/**
 * Unit tests for C4 keyboard policy (Milestone 1.1 core subset: R09 / A7).
 * Full custom 150 ms / 50 ms held-key repeat and rotation/pause/hold/hard-drop
 * mappings are expanded in Milestones 1.2–1.4.
 */
describe('C4 keyboard policy: Milestone 1.1 basic key mapping and target eligibility (R09 / A7)', () => {
  it('maps physical KeyboardEvent.code values for start, horizontal move, and soft drop', () => {
    expect(mapKeyDownToAction({ code: 'Enter', repeat: false })).toBe('start');
    expect(mapKeyDownToAction({ code: 'ArrowLeft', repeat: false })).toBe('move-left');
    expect(mapKeyDownToAction({ code: 'ArrowRight', repeat: false })).toBe('move-right');
    expect(mapKeyDownToAction({ code: 'ArrowDown', repeat: false })).toBe('soft-drop');
    expect(mapKeyDownToAction({ code: 'KeyA', repeat: false })).toBeNull();
  });

  it('suppresses native browser repeat on discrete start action while allowing basic movement in Milestone 1.1', () => {
    expect(mapKeyDownToAction({ code: 'Enter', repeat: true })).toBeNull();
  });

  it('rejects keyboard shortcuts when focus is on a button, input, textarea, select, or contentEditable element', () => {
    expect(isEligibleKeyboardTarget(null)).toBe(true);
    expect(isEligibleKeyboardTarget({ tagName: 'DIV', isContentEditable: false })).toBe(true);
    expect(isEligibleKeyboardTarget({ tagName: 'BODY', isContentEditable: false })).toBe(true);
    expect(isEligibleKeyboardTarget({ tagName: 'BUTTON', isContentEditable: false })).toBe(false);
    expect(isEligibleKeyboardTarget({ tagName: 'INPUT', isContentEditable: false })).toBe(false);
    expect(isEligibleKeyboardTarget({ tagName: 'TEXTAREA', isContentEditable: false })).toBe(false);
    expect(isEligibleKeyboardTarget({ tagName: 'SELECT', isContentEditable: false })).toBe(false);
    expect(isEligibleKeyboardTarget({ tagName: 'DIV', isContentEditable: true })).toBe(false);
  });
});
