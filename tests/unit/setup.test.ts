import { describe, expect, it } from 'vitest';
import { createTetrisApp } from '../../src/app.ts';

/**
 * T-001 bounded unit setup probe verifying TypeScript/Vitest execution
 * and C7 composition root/Canvas error handling before browser mounting (R11/R12).
 */
describe('T-001 setup probe: composition skeleton', () => {
  it('rejects a null root element with a clear initialization error', () => {
    expect(() => createTetrisApp(null)).toThrow(/root element/i);
  });

  it('renders a readable initialization error into the root and throws when Canvas 2D is unavailable', () => {
    const appended: unknown[] = [];
    const fakeDocument = {
      createElement(tag: string) {
        return {
          tagName: tag.toUpperCase(),
          className: '',
          width: 0,
          height: 0,
          textContent: '',
          attrs: new Map<string, string>(),
          children: [] as unknown[],
          setAttribute(name: string, value: string) {
            this.attrs.set(name, value);
          },
          getAttribute(name: string) {
            return this.attrs.get(name) ?? null;
          },
          appendChild(child: unknown) {
            this.children.push(child);
            return child;
          },
          getContext() {
            return null;
          },
        };
      },
    };
    const fakeRoot = {
      innerHTML: 'stale',
      ownerDocument: fakeDocument,
      appendChild(child: unknown) {
        appended.push(child);
        return child;
      },
    } as unknown as HTMLElement;

    expect(() => createTetrisApp(fakeRoot)).toThrow(/Canvas 2D/i);
    expect(appended).toHaveLength(1);
    const errorEl = appended[0] as { getAttribute(name: string): string | null; textContent: string };
    expect(errorEl.getAttribute('data-testid')).toBe('init-error');
    expect(errorEl.getAttribute('role')).toBe('alert');
    expect(errorEl.textContent).toMatch(/Canvas 2D/i);
  });
});
