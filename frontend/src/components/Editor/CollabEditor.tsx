import React, { useEffect, useRef } from 'react';
import { EditorState } from '@codemirror/state';
import { EditorView, lineNumbers, keymap } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { oneDark } from '@codemirror/theme-one-dark';
import * as Y from 'yjs';
import { yCollab } from 'y-codemirror.next';

interface CollabEditorProps {
  initialCode?: string;
  language?: string;
  onChange?: (code: string) => void;
  readOnly?: boolean;
}

export const CollabEditor: React.FC<CollabEditorProps> = ({
  initialCode = '',
  language = 'typescript',
  onChange,
  readOnly = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorViewRef = useRef<EditorView | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Yjs document setup
    const ydoc = new Y.Doc();
    const ytext = ydoc.getText('codemirror');

    if (initialCode && ytext.length === 0) {
      ytext.insert(0, initialCode);
    }

    const langExtension = language.toLowerCase().includes('python')
      ? python()
      : javascript({ typescript: true });

    const state = EditorState.create({
      doc: ytext.toString(),
      extensions: [
        lineNumbers(),
        history(),
        keymap.of([...defaultKeymap, ...historyKeymap]),
        langExtension,
        oneDark,
        yCollab(ytext, null),
        EditorView.updateListener.of((update) => {
          if (update.docChanged && onChange) {
            onChange(update.state.doc.toString());
          }
        }),
        EditorView.editable.of(!readOnly),
        EditorView.theme({
          '&': { height: '100%', fontSize: '13px' },
          '.cm-scroller': { overflow: 'auto', fontFamily: '"JetBrains Mono", monospace' },
          '.cm-gutters': { backgroundColor: '#0B0D13', borderRight: '1px solid rgba(255,255,255,0.08)' },
        }),
      ],
    });

    const view = new EditorView({
      state,
      parent: containerRef.current,
    });

    editorViewRef.current = view;

    return () => {
      view.destroy();
      ydoc.destroy();
    };
  }, [language, readOnly]);

  return (
    <div className="w-full h-full relative flex flex-col bg-[#0E1116] overflow-hidden">
      <div ref={containerRef} className="flex-1 w-full h-full overflow-hidden" />
    </div>
  );
};
