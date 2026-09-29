import * as Y from 'yjs';
import assert from 'node:assert';

console.log('Testing AC-13: Simultaneous two-user CRDT concurrent edits without conflict or data loss...');

// Peer A (Interviewer)
const docA = new Y.Doc();
const textA = docA.getText('codemirror');

// Peer B (Candidate)
const docB = new Y.Doc();
const textB = docB.getText('codemirror');

// Initial sync
textA.insert(0, 'function solve() {\n  return 0;\n}');
const update1 = Y.encodeStateAsUpdate(docA);
Y.applyUpdate(docB, update1);

assert.strictEqual(textA.toString(), textB.toString(), 'Initial documents should match');

// Concurrent edits:
// Peer A modifies inside function body
textA.insert(20, 'const x = 10;\n  ');

// Peer B modifies at the end
textB.insert(textB.length - 1, '  console.log("done");\n');

// Exchange updates
const updateA = Y.encodeStateAsUpdate(docA);
const updateB = Y.encodeStateAsUpdate(docB);

Y.applyUpdate(docA, updateB);
Y.applyUpdate(docB, updateA);

// Verify convergence
assert.strictEqual(textA.toString(), textB.toString(), 'Both documents must converge identically');
assert(textA.toString().includes('const x = 10;'), 'Doc must retain Peer A text');
assert(textA.toString().includes('console.log("done");'), 'Doc must retain Peer B text');

console.log('✓ AC-13 PASS: Yjs CRDT converged with 0 conflicts and 0 data loss.');
console.log('Converged text:\n' + textA.toString());
