import { useState } from 'react';
import Editor from '@monaco-editor/react';
import { registerHackLanguage, HACK_LANGUAGE_ID } from './editor/hackLanguage';

const INITIAL_CODE = `// Example Hack Assembly Program
@2
D=A
@3
D=D+A
@0
M=D
(INFINITE_LOOP)
@INFINITE_LOOP
0;JMP
`;

export default function App() {
  const [code, setCode] = useState(INITIAL_CODE);

  // Registers 'hack-asm' Monarch grammar right before the editor mounts
  const handleEditorWillMount = (monaco: typeof import('monaco-editor')) => {
    registerHackLanguage(monaco);
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#1e1e1e', color: '#fff' }}>
      <header style={{ padding: '12px 20px', borderBottom: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 600 }}>Hack Assembly IDE & Linter</h2>
        <span style={{ fontSize: '0.85rem', color: '#888' }}>CS207 Course Project</span>
      </header>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Editor Pane (Left) */}
        <div style={{ flex: 1, borderRight: '1px solid #333' }}>
          <Editor
            height="100%"
            defaultLanguage={HACK_LANGUAGE_ID}
            theme="vs-dark"
            value={code}
            beforeMount={handleEditorWillMount}
            onChange={(val) => setCode(val || '')}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              lineNumbers: 'on',
              scrollBeyondLastLine: false,
              automaticLayout: true,
            }}
          />
        </div>

        {/* Machine Code Preview (Right) */}
        <div style={{ width: '380px', padding: '16px', backgroundColor: '#181818', overflowY: 'auto' }}>
          <h3 style={{ margin: '0 0 12px 0', fontSize: '1rem', color: '#ccc' }}>Machine Code Preview (.hack)</h3>
          <div style={{ padding: '12px', backgroundColor: '#242424', borderRadius: '4px', fontFamily: 'monospace', fontSize: '0.9rem', color: '#4ec9b0' }}>
            // Compiled 16-bit binary lines will appear here in Week 2
          </div>
        </div>
      </div>
    </div>
  );
}