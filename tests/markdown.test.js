import test from 'node:test';
import assert from 'node:assert';
import {
  DOCUMENT_TEMPLATES,
  calculateDocStats,
  applyFormatting,
  parseMarkdownBlocks,
} from '../lib/markdown.js';

test('DOCUMENT_TEMPLATES catalog contains valid templates', (t) => {
  assert.ok(Array.isArray(DOCUMENT_TEMPLATES));
  assert.ok(DOCUMENT_TEMPLATES.length >= 4);

  DOCUMENT_TEMPLATES.forEach((tmpl) => {
    assert.ok(tmpl.id, 'Template must have an id');
    assert.ok(tmpl.name, 'Template must have a name');
    assert.ok(tmpl.description, 'Template must have a description');
    assert.ok(tmpl.content.length > 50, 'Template content should be substantive');
    assert.ok(tmpl.content.startsWith('#'), 'Template should start with markdown heading');
  });
});

test('calculateDocStats returns accurate word, char, and reading time counts', (t) => {
  const emptyStats = calculateDocStats('');
  assert.strictEqual(emptyStats.words, 0);
  assert.strictEqual(emptyStats.chars, 0);
  assert.strictEqual(emptyStats.lines, 0);
  assert.strictEqual(emptyStats.readingTime, 1);

  const sampleText = 'Distributed systems require high concurrency and low latency.\nSyncSpace delivers real-time collaboration.';
  const stats = calculateDocStats(sampleText);
  assert.strictEqual(stats.words, 12);
  assert.strictEqual(stats.chars, sampleText.length);
  assert.strictEqual(stats.lines, 2);
  assert.strictEqual(stats.readingTime, 1);

  // High word count test for reading time
  const longText = Array(450).fill('word').join(' ');
  const longStats = calculateDocStats(longText);
  assert.strictEqual(longStats.words, 450);
  assert.strictEqual(longStats.readingTime, 3);
});

test('applyFormatting wraps text correctly for inline formats', (t) => {
  // Bold
  const boldRes = applyFormatting('Hello World', 6, 11, 'bold');
  assert.strictEqual(boldRes.newContent, 'Hello **World**');

  // Italic
  const italicRes = applyFormatting('Hello World', 0, 5, 'italic');
  assert.strictEqual(italicRes.newContent, '*Hello* World');

  // Strikethrough
  const strikeRes = applyFormatting('Deprecated', 0, 10, 'strikethrough');
  assert.strictEqual(strikeRes.newContent, '~~Deprecated~~');

  // Inline Code
  const codeRes = applyFormatting('run test now', 4, 8, 'code');
  assert.strictEqual(codeRes.newContent, 'run `test` now');

  // Link
  const linkRes = applyFormatting('Click here', 0, 10, 'link');
  assert.strictEqual(linkRes.newContent, '[Click here](https://example.com)');
});

test('applyFormatting inserts block-level elements correctly', (t) => {
  // H1
  const h1Res = applyFormatting('Title', 0, 5, 'h1');
  assert.ok(h1Res.newContent.includes('# Title'));

  // H2
  const h2Res = applyFormatting('Section', 0, 7, 'h2');
  assert.ok(h2Res.newContent.includes('## Section'));

  // Quote
  const quoteRes = applyFormatting('Important notice', 0, 16, 'quote');
  assert.ok(quoteRes.newContent.includes('> Important notice'));

  // Bullet List
  const bulletRes = applyFormatting('First item', 0, 10, 'bullet');
  assert.ok(bulletRes.newContent.includes('- First item'));

  // Numbered List
  const numRes = applyFormatting('Step one', 0, 8, 'number');
  assert.ok(numRes.newContent.includes('1. Step one'));

  // Task List
  const taskRes = applyFormatting('Deploy service', 0, 14, 'task');
  assert.ok(taskRes.newContent.includes('- [ ] Deploy service'));

  // Table
  const tableRes = applyFormatting('', 0, 0, 'table');
  assert.ok(tableRes.newContent.includes('| Column 1 | Column 2 | Column 3 |'));
  assert.ok(tableRes.newContent.includes('|---|---|---|'));

  // Codeblock
  const codeBlockRes = applyFormatting('', 0, 0, 'codeblock');
  assert.ok(codeBlockRes.newContent.includes('```javascript'));
});

test('parseMarkdownBlocks parses headers, code blocks, tables, and lists', (t) => {
  const markdown = `# Architecture Overview

This is an introductory paragraph.

\`\`\`javascript
const socket = io();
socket.emit('join-room');
\`\`\`

> Remember to verify reconnection jitter.

- [x] Implement socket events
- [ ] Add unit tests

| Service | Protocol | Port |
|---|---|---|
| API | HTTP | 4000 |
| Dashboard | NextJS | 3000 |

1. Clone repo
2. Run docker compose
`;

  const blocks = parseMarkdownBlocks(markdown);
  assert.ok(blocks.length >= 7, `Expected at least 7 blocks, got ${blocks.length}`);

  // H1
  assert.strictEqual(blocks[0].type, 'h1');
  assert.strictEqual(blocks[0].content, 'Architecture Overview');

  // Paragraph
  assert.strictEqual(blocks[1].type, 'paragraph');
  assert.strictEqual(blocks[1].content, 'This is an introductory paragraph.');

  // Code
  assert.strictEqual(blocks[2].type, 'code');
  assert.strictEqual(blocks[2].language, 'javascript');
  assert.ok(blocks[2].content.includes('join-room'));

  // Quote
  assert.strictEqual(blocks[3].type, 'quote');
  assert.ok(blocks[3].content.includes('reconnection jitter'));

  // Tasklist
  assert.strictEqual(blocks[4].type, 'tasklist');
  assert.strictEqual(blocks[4].items.length, 2);
  assert.strictEqual(blocks[4].items[0].checked, true);
  assert.strictEqual(blocks[4].items[1].checked, false);

  // Table
  assert.strictEqual(blocks[5].type, 'table');
  assert.deepStrictEqual(blocks[5].headers, ['Service', 'Protocol', 'Port']);
  assert.strictEqual(blocks[5].rows.length, 2);

  // Numbered List
  assert.strictEqual(blocks[6].type, 'numberedlist');
  assert.strictEqual(blocks[6].items.length, 2);
});
