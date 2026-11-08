/**
 * SyncSpace Collaborative Markdown Utility
 * Provides document formatting helpers, statistics computation,
 * template catalog, and lightweight structured markdown parsing.
 */

export const DOCUMENT_TEMPLATES = [
  {
    id: 'rfc',
    name: 'Architecture RFC',
    description: 'System design proposal, trade-offs, and event protocols',
    content: `# RFC: Real-Time Collaborative Architecture

**Status:** Draft | Proposed  
**Author:** SyncSpace Engineering  
**Version:** v1.0.0  

## 1. Context & Motivation
Modern distributed teams require instantaneous document synchronization with sub-50ms latency, zero locking contention, and multi-user awareness.

## 2. Technical Architecture & Topology
- **WebSocket Transport**: Socket.io bidirectional duplex connection with 25s keepalive.
- **Monotonic Revisions**: Optimistic client mutations paired with monotonic version increments.
- **Multi-User Presence**: Ephemeral pointer tracking streamed at 20fps with auto-cleanup.

## 3. Event Protocol Contract
\`\`\`typescript
interface SyncEventPayload {
  roomId: string;
  revision: number;
  delta: string;
  author: string;
}
\`\`\`

## 4. Key Trade-offs
1. **Monotonic Revisions vs. Operational Transforms**: Simpler conflict model with zero serialization overhead.
2. **Dual-Mode Persistence**: In-memory cache allows instantaneous offline operation without database locks.

## 5. Next Steps
- [ ] Implement rich toolbar shortcuts
- [ ] Benchmark p99 round-trip latency
- [ ] Deploy multi-region cluster
`,
  },
  {
    id: 'standup',
    name: 'Daily Standup Sync',
    description: 'Sprint tasks, blockers, and shipping goals',
    content: `# ⚡ Daily Engineering Standup

**Date:** Daily Sync  
**Sprint Focus:** Core Real-Time Collaboration Engine  

---

### 🟢 Completed Yesterday
- [x] Initialized Socket.io bidirectional sync pipeline
- [x] Built live SVG cursor streaming overlay at 20fps
- [x] Implemented in-memory fallback store with 44 passing unit tests

### 🟡 In Progress Today
- [ ] Real-time document editor rich formatting toolbar
- [ ] Document export engine (Markdown .md and clipboard sync)
- [ ] Revision audit log timeline viewer with diff highlights

### 🔴 Blockers & Dependencies
- *None currently.* All microservices operating smoothly.

---

### 🎯 Key Deliverables
1. Complete Next.js 16 collaborative editor test suite.
2. Verify standalone Docker container build under 150MB.
`,
  },
  {
    id: 'api-spec',
    name: 'API Specification',
    description: 'REST endpoints and WebSocket event contracts',
    content: `# 🔌 API Specification & Event Protocol

**Service:** SyncSpace Engine  
**Version:** v1.0.0  
**Transport:** HTTP/REST + WebSocket  

---

## REST Endpoints

### 1. \`GET /api/rooms\`
List active workspace rooms with active presence counts and topic filters.

### 2. \`POST /api/rooms\`
Create a new workspace room.
\`\`\`json
{
  "roomId": "eng-sync",
  "name": "Engineering Sync",
  "topic": "engineering",
  "maxParticipants": 50
}
\`\`\`

### 3. \`GET /api/rooms/:roomId/document\`
Fetch current document state and monotonic revision number.

---

## WebSocket Event Matrix

| Event Name | Direction | Description |
|---|---|---|
| \`join-room\` | Client → Server | Joins room channel and broadcasts presence |
| \`doc-edit\` | Client → Server | Broadcasts document edits with optimistic update |
| \`doc-updated\` | Server → Client | Delivers reconciled document state to peers |
| \`cursor-move\` | Client → Server | Streams pointer coordinates at 20fps |
| \`send-message\` | Client → Server | Dispatches room chat message |
`,
  },
  {
    id: 'postmortem',
    name: 'Incident Postmortem',
    description: 'Root cause analysis and preventative action items',
    content: `# 🚨 Incident Postmortem: [Incident Name]

**Date:** [Date]  
**Severity:** P2 (Degradation)  
**Time to Resolve:** 8m  

---

## 1. Executive Summary
Brief overview of what occurred, impact on end-users, and recovery steps.

## 2. Impact Metrics
- **Downtime:** 8 minutes
- **Affected Endpoints:** WebSocket room join handshakes
- **Data Loss:** 0% (dual-mode in-memory cache preserved state)

## 3. Root Cause Analysis
Client sockets were attempting immediate linear retries on network blips rather than exponential backoff with jitter.

## 4. Preventative Action Items
- [ ] Add exponential backoff jitter to client socket reconnect loop
- [ ] Add Prometheus metric alerting for reconnect storm spikes
- [ ] Document failure mode in system architecture runbook
`,
  },
];

/**
 * Calculates text statistics: word count, char count, line count, and reading time.
 */
export function calculateDocStats(text = '') {
  const trimmed = text.trim();
  const words = trimmed ? trimmed.split(/\s+/).length : 0;
  const chars = text.length;
  const lines = text ? text.split('\n').length : 0;
  const readingTime = Math.max(1, Math.ceil(words / 200));

  return {
    words,
    chars,
    lines,
    readingTime,
  };
}

/**
 * Applies Markdown formatting around the user's cursor selection or inserts a placeholder.
 */
export function applyFormatting(content = '', start = 0, end = 0, action = '') {
  const before = content.substring(0, start);
  const selected = content.substring(start, end);
  const after = content.substring(end);

  let insertion = '';
  let newStart = start;
  let newEnd = end;

  switch (action) {
    case 'bold': {
      const text = selected || 'bold text';
      insertion = `**${text}**`;
      newStart = start + 2;
      newEnd = newStart + text.length;
      break;
    }
    case 'italic': {
      const text = selected || 'italic text';
      insertion = `*${text}*`;
      newStart = start + 1;
      newEnd = newStart + text.length;
      break;
    }
    case 'strikethrough': {
      const text = selected || 'strikethrough text';
      insertion = `~~${text}~~`;
      newStart = start + 2;
      newEnd = newStart + text.length;
      break;
    }
    case 'code': {
      const text = selected || 'code';
      insertion = '`' + text + '`';
      newStart = start + 1;
      newEnd = newStart + text.length;
      break;
    }
    case 'codeblock': {
      const text = selected || '// Insert code here\nconsole.log("SyncSpace real-time");';
      insertion = `\`\`\`javascript\n${text}\n\`\`\`\n`;
      newStart = start + 13;
      newEnd = newStart + text.length;
      break;
    }
    case 'h1': {
      const text = selected || 'Heading 1';
      insertion = `\n# ${text}\n`;
      newStart = start + 3;
      newEnd = newStart + text.length;
      break;
    }
    case 'h2': {
      const text = selected || 'Heading 2';
      insertion = `\n## ${text}\n`;
      newStart = start + 4;
      newEnd = newStart + text.length;
      break;
    }
    case 'h3': {
      const text = selected || 'Heading 3';
      insertion = `\n### ${text}\n`;
      newStart = start + 5;
      newEnd = newStart + text.length;
      break;
    }
    case 'quote': {
      const text = selected || 'Quote text';
      insertion = `\n> ${text}\n`;
      newStart = start + 3;
      newEnd = newStart + text.length;
      break;
    }
    case 'bullet': {
      const text = selected || 'List item';
      insertion = `\n- ${text}\n`;
      newStart = start + 3;
      newEnd = newStart + text.length;
      break;
    }
    case 'number': {
      const text = selected || 'Ordered item';
      insertion = `\n1. ${text}\n`;
      newStart = start + 4;
      newEnd = newStart + text.length;
      break;
    }
    case 'task': {
      const text = selected || 'Task item';
      insertion = `\n- [ ] ${text}\n`;
      newStart = start + 7;
      newEnd = newStart + text.length;
      break;
    }
    case 'table': {
      insertion = `\n| Column 1 | Column 2 | Column 3 |\n|---|---|---|\n| Item A | Value 1 | Active |\n| Item B | Value 2 | Pending |\n`;
      newStart = start + 3;
      newEnd = start + insertion.length;
      break;
    }
    case 'link': {
      const text = selected || 'link text';
      insertion = `[${text}](https://example.com)`;
      newStart = start + 1;
      newEnd = newStart + text.length;
      break;
    }
    case 'hr': {
      insertion = `\n---\n`;
      newStart = start + 5;
      newEnd = newStart;
      break;
    }
    default:
      return { newContent: content, newStart: start, newEnd: end };
  }

  const newContent = before + insertion + after;
  return { newContent, newStart, newEnd };
}

/**
 * Light structured markdown parser converting raw text into clean typed blocks
 * for rendering in the live preview panel.
 */
export function parseMarkdownBlocks(text = '') {
  if (!text || !text.trim()) {
    return [];
  }

  const rawBlocks = text.split(/\n\n+/);
  const blocks = [];

  for (let i = 0; i < rawBlocks.length; i++) {
    const raw = rawBlocks[i].trim();
    if (!raw) continue;

    // Fenced Code Block
    if (raw.startsWith('```')) {
      const lines = raw.split('\n');
      const lang = lines[0].replace('```', '').trim() || 'plaintext';
      const lastLineIsFence = lines[lines.length - 1].trim() === '```';
      const codeLines = lines.slice(1, lastLineIsFence ? lines.length - 1 : lines.length);
      blocks.push({
        type: 'code',
        language: lang,
        content: codeLines.join('\n'),
      });
      continue;
    }

    // Headers
    if (raw.startsWith('# ')) {
      blocks.push({ type: 'h1', content: raw.replace(/^#\s+/, '') });
      continue;
    }
    if (raw.startsWith('## ')) {
      blocks.push({ type: 'h2', content: raw.replace(/^##\s+/, '') });
      continue;
    }
    if (raw.startsWith('### ')) {
      blocks.push({ type: 'h3', content: raw.replace(/^###\s+/, '') });
      continue;
    }
    if (raw.startsWith('#### ')) {
      blocks.push({ type: 'h4', content: raw.replace(/^####\s+/, '') });
      continue;
    }

    // Horizontal Rule
    if (raw === '---' || raw === '***' || raw === '___') {
      blocks.push({ type: 'hr' });
      continue;
    }

    // Blockquote
    if (raw.startsWith('>')) {
      const lines = raw.split('\n').map((l) => l.replace(/^>\s?/, ''));
      blocks.push({ type: 'quote', content: lines.join(' ') });
      continue;
    }

    // Table
    if (raw.includes('|') && raw.includes('---')) {
      const lines = raw.split('\n').filter((l) => l.includes('|'));
      if (lines.length >= 2) {
        const headerCols = lines[0]
          .split('|')
          .slice(1, -1)
          .map((c) => c.trim());
        const dataRows = lines.slice(2).map((row) =>
          row
            .split('|')
            .slice(1, -1)
            .map((c) => c.trim())
        );
        blocks.push({
          type: 'table',
          headers: headerCols,
          rows: dataRows,
        });
        continue;
      }
    }

    // Task List or Bullet List
    if (raw.startsWith('- [ ]') || raw.startsWith('- [x]') || raw.startsWith('- ') || raw.startsWith('* ')) {
      const items = raw.split('\n');
      const isTask = items.some((item) => item.startsWith('- [ ]') || item.startsWith('- [x]'));

      if (isTask) {
        const taskItems = items.map((item) => {
          const checked = item.startsWith('- [x]');
          const cleanText = item.replace(/^- \[[ x]\]\s*/, '');
          return { text: cleanText, checked };
        });
        blocks.push({ type: 'tasklist', items: taskItems });
      } else {
        const listItems = items.map((item) => item.replace(/^[-*]\s+/, ''));
        blocks.push({ type: 'bulletlist', items: listItems });
      }
      continue;
    }

    // Numbered List
    if (/^\d+\.\s+/.test(raw)) {
      const items = raw.split('\n').map((item) => item.replace(/^\d+\.\s+/, ''));
      blocks.push({ type: 'numberedlist', items });
      continue;
    }

    // Regular Paragraph
    blocks.push({ type: 'paragraph', content: raw });
  }

  return blocks;
}

/**
 * Triggers browser file download of document content as a Markdown (.md) file.
 */
export function downloadMarkdownFile(filename = 'document.md', content = '') {
  if (typeof window === 'undefined') return;

  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.md') ? filename : `${filename}.md`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
