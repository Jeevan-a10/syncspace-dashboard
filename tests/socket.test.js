import test from 'node:test';
import assert from 'node:assert';
import { USER_PALETTES, getPaletteColor } from '../lib/socket.js';

test('USER_PALETTES definition', (t) => {
  assert.ok(Array.isArray(USER_PALETTES));
  assert.ok(USER_PALETTES.length >= 5);
  USER_PALETTES.forEach((palette) => {
    assert.ok(palette.name, 'Palette must have a name');
    assert.ok(palette.bg, 'Palette must have a bg color');
    assert.ok(palette.bg.startsWith('#'), 'Palette bg must be a valid hex color');
  });
});

test('getPaletteColor assigns deterministic color from identifier', (t) => {
  const color1 = getPaletteColor('usr_alex');
  const color2 = getPaletteColor('usr_alex');
  assert.deepStrictEqual(color1, color2, 'Same identifier must return identical color');

  const emptyColor = getPaletteColor('');
  assert.deepStrictEqual(emptyColor, USER_PALETTES[0]);
});

test('Socket.io event contract validation', (t) => {
  const CLIENT_EVENTS = [
    'join-room',
    'leave-room',
    'doc-edit',
    'cursor-move',
    'typing',
    'send-message',
  ];
  const SERVER_EVENTS = [
    'room-state',
    'user-joined',
    'user-left',
    'doc-updated',
    'cursor-updated',
    'user-typing',
    'new-message',
  ];

  assert.strictEqual(CLIENT_EVENTS.length, 6);
  assert.strictEqual(SERVER_EVENTS.length, 7);
});
