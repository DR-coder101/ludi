import { describe, expect, it } from 'vitest';
import { isConfiguredCommand, parseCommand } from './parseCommand.js';

describe('parseCommand', () => {
  it('accepts !join with mixed case and extra spaces', () => {
    expect(parseCommand('  !JoIn  ')).toEqual({ kind: 'join' });
  });

  it('accepts !roll with mixed case and extra spaces', () => {
    expect(parseCommand('\t!ROLL\n')).toEqual({ kind: 'roll' });
  });

  it('accepts !move 1-4 with extra spaces', () => {
    expect(parseCommand('!move  1')).toEqual({ kind: 'move', piece: 1 });
    expect(parseCommand('  !MOVE   4  ')).toEqual({ kind: 'move', piece: 4 });
    expect(parseCommand('!Move 2')).toEqual({ kind: 'move', piece: 2 });
    expect(parseCommand('!move 3')).toEqual({ kind: 'move', piece: 3 });
  });

  it('ignores !move outside 1-4', () => {
    expect(parseCommand('!move 0')).toEqual({ kind: 'ignore' });
    expect(parseCommand('!move 5')).toEqual({ kind: 'ignore' });
    expect(parseCommand('!move 99')).toEqual({ kind: 'ignore' });
  });

  it('ignores !move without a piece number', () => {
    expect(parseCommand('!move')).toEqual({ kind: 'ignore' });
    expect(parseCommand('!move x')).toEqual({ kind: 'ignore' });
  });

  it('ignores non-commands', () => {
    expect(parseCommand('hello')).toEqual({ kind: 'ignore' });
    expect(parseCommand('join')).toEqual({ kind: 'ignore' });
    expect(parseCommand('!stay')).toEqual({ kind: 'ignore' });
    expect(parseCommand('')).toEqual({ kind: 'ignore' });
    expect(parseCommand('   ')).toEqual({ kind: 'ignore' });
  });

  it('uses configured prefixes', () => {
    const prefixes = { join: '!play', roll: '!dice', move: '!pick' };
    expect(parseCommand('!play', prefixes)).toEqual({ kind: 'join' });
    expect(parseCommand('!dice', prefixes)).toEqual({ kind: 'roll' });
    expect(parseCommand('!pick 2', prefixes)).toEqual({ kind: 'move', piece: 2 });
    expect(parseCommand('!join', prefixes)).toEqual({ kind: 'ignore' });
  });

  it('filters configured commands only', () => {
    expect(isConfiguredCommand('!join')).toBe(true);
    expect(isConfiguredCommand('nice stream')).toBe(false);
  });
});
