import { useState, useMemo } from 'react';
import Editor from '@monaco-editor/react';
import { registerHackLanguage } from './editor/hackLanguage';
import { assembleHackSource } from './core/assembler';
import './App.css';

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

export function App() {
  const [sourceCode, setSourceCode] = useState<string>(INITIAL_CODE);

  const { binaryLines, diagnostics } = useMemo(() => {
    return assembleHackSource(sourceCode);
  }, [sourceCode]);

  return (
    <div className="ide-container">
      <header className="ide-header">
        <h1>Hack Assembly IDE & Linter</h1>
        <span className="course-tag">CS207 Course Project</span>
      </header>
      
      <main className="ide-workspace">
        <div className="editor-pane">
          <Editor
            height="100%"
            defaultLanguage="hack"
            theme="hack-dark"
            value={sourceCode}
            onChange={(val) => setSourceCode(val || '')}
            beforeMount={(monaco) => registerHackLanguage(monaco)}
            options={{
              fontSize: 14,
              fontFamily: "'Fira Code', monospace",
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              automaticLayout: true,
            }}
          />
        </div>

        <div className="preview-pane">
          <h3>Machine Code Preview (.hack)</h3>
          {diagnostics.length > 0 ? (
            <div className="diagnostics-panel" style={{ color: '#ff6b6b', padding: '10px' }}>
              <h4>Assembly Errors:</h4>
              <ul>
                {diagnostics.map((err, idx) => (
                  <li key={idx}>Line {err.lineNumber}: {err.message}</li>
                ))}
              </ul>
            </div>
          ) : (
            <pre className="binary-output" style={{ padding: '10px', color: '#68d391', fontFamily: 'monospace' }}>
              {binaryLines.length > 0 ? binaryLines.join('\n') : '// No executable instructions'}
            </pre>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;