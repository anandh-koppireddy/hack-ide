import { useState, useMemo, useRef } from 'react';
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
  const [currentFileName, setCurrentFileName] = useState<string>('program.asm');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { binaryLines, diagnostics } = useMemo(() => {
    return assembleHackSource(sourceCode);
  }, [sourceCode]);

  const handleOpenFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCurrentFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content !== undefined) {
        setSourceCode(content);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleDownloadHack = () => {
    if (binaryLines.length === 0 || diagnostics.length > 0) return;

    const binaryContent = binaryLines.join('\n');
    const blob = new Blob([binaryContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const downloadName = currentFileName.replace(/\.asm$/i, '') + '.hack';

    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = downloadName;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="ide-container">
      <header className="ide-header">
        <div className="header-left">
          <h1>Hack Assembly IDE & Linter</h1>
          <span className="file-badge">{currentFileName}</span>
        </div>

        <div className="header-actions">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".asm,.txt"
            style={{ display: 'none' }}
          />

          <button className="btn btn-secondary" onClick={handleOpenFileClick}>
            Open File (.asm)
          </button>

          <button
            className="btn btn-primary"
            onClick={handleDownloadHack}
            disabled={diagnostics.length > 0 || binaryLines.length === 0}
            title={diagnostics.length > 0 ? 'Fix errors to download .hack binary' : 'Download binary'}
          >
            Export .hack
          </button>

          <span className="course-tag">CS207 Course Project</span>
        </div>
      </header>

      <main className="ide-workspace">
        <div className="editor-pane">
          <Editor
            height="100%"
            width="100%"
            language="hack"
            theme="hack-dark"
            value={sourceCode}
            onChange={(val) => setSourceCode(val || '')}
            beforeMount={(monaco) => registerHackLanguage(monaco)}
            onMount={(_editor, monaco) => {
              monaco.editor.setTheme('hack-dark');
            }}
            options={{
              fontSize: 14,
              fontFamily: "'Fira Code', Consolas, monospace",
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              automaticLayout: true,
            }}
          />
        </div>

        <div className="preview-pane">
          <h3>Machine Code Preview (.hack)</h3>
          {diagnostics.length > 0 ? (
            <div className="diagnostics-panel">
              <h4>Assembly Errors:</h4>
              <ul>
                {diagnostics.map((err, idx) => (
                  <li key={idx}>
                    Line {err.lineNumber}: {err.message}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <pre className="binary-output">
              {binaryLines.length > 0 ? binaryLines.join('\n') : '// No executable instructions'}
            </pre>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;