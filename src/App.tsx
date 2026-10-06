import { useState, useMemo, useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import type * as MonacoType from 'monaco-editor';
import { registerHackLanguage } from './editor/hackLanguage';
import { assembleHackSource } from './core/assembler';
import { PRELOADED_EXAMPLES } from './core/examples';
import './App.css';

// Helper function to completely remove all blank lines and trim whitespace
const normalizeAssemblyCode = (rawText: string): string => {
  return rawText
    .replace(/\r\n/g, '\n') // Normalize Windows line endings to Unix
    .split('\n')
    .map((line) => line.trim()) // Trim leading and trailing spaces on every line
    .filter((line) => line !== '') // Remove ALL empty/blank lines completely
    .join('\n');
};

export function App() {
  const [sourceCode, setSourceCode] = useState<string>(PRELOADED_EXAMPLES[0].code);
  const [currentFileName, setCurrentFileName] = useState<string>(PRELOADED_EXAMPLES[0].filename);
  const [selectedExampleId, setSelectedExampleId] = useState<string>('default');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editorRef = useRef<MonacoType.editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<typeof MonacoType | null>(null);

  const { binaryLines, diagnostics } = useMemo(() => {
    return assembleHackSource(sourceCode);
  }, [sourceCode]);

  // Synchronize diagnostics with Monaco In-Editor Markers
  useEffect(() => {
    if (!monacoRef.current || !editorRef.current) return;

    const model = editorRef.current.getModel();
    if (!model) return;

    const markers: MonacoType.editor.IMarkerData[] = diagnostics.map((diag) => ({
      severity:
        diag.severity === 'warning'
          ? monacoRef.current!.MarkerSeverity.Warning
          : monacoRef.current!.MarkerSeverity.Error,
      message: diag.message,
      startLineNumber: diag.lineNumber,
      startColumn: diag.columnStart || 1,
      endLineNumber: diag.lineNumber,
      endColumn: diag.columnEnd || model.getLineMaxColumn(diag.lineNumber),
    }));

    monacoRef.current.editor.setModelMarkers(model, 'hack-linter', markers);
  }, [diagnostics]);

  const handleSelectExample = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    setSelectedExampleId(selectedId);
    const example = PRELOADED_EXAMPLES.find((ex) => ex.id === selectedId);
    if (example) {
      setSourceCode(example.code);
      setCurrentFileName(example.filename);
    }
  };

  const handleOpenFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCurrentFileName(file.name);
    setSelectedExampleId('custom');
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content !== undefined) {
        // Clean and normalize the loaded file contents automatically
        const cleanedCode = normalizeAssemblyCode(content);
        setSourceCode(cleanedCode);
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

          {/* Preloaded Examples Dropdown */}
          <div className="dropdown-container">
            <select
              className="select-dropdown"
              value={selectedExampleId}
              onChange={handleSelectExample}
            >
              {PRELOADED_EXAMPLES.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.name}
                </option>
              ))}
              {selectedExampleId === 'custom' && (
                <option value="custom">Custom Uploaded File</option>
              )}
            </select>
          </div>
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
            onChange={(val) => {
              setSourceCode(val || '');
              if (selectedExampleId !== 'custom') {
                setSelectedExampleId('custom');
              }
            }}
            beforeMount={(monaco) => registerHackLanguage(monaco)}
            onMount={(editor, monaco) => {
              editorRef.current = editor;
              monacoRef.current = monaco;
              monaco.editor.setTheme('hack-dark');
            }}
            options={{
              fontSize: 14,
              fontFamily: "'Fira Code', Consolas, monospace",
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              automaticLayout: true,
              glyphMargin: true,
            }}
          />
        </div>

        <div className="preview-pane">
          <div className="preview-header">
            <h3>Machine Code Preview (.hack)</h3>
            <span className="instruction-count">
              {binaryLines.length} {binaryLines.length === 1 ? 'Word' : 'Words'}
            </span>
          </div>

          {diagnostics.length > 0 ? (
            <div className="diagnostics-panel">
              <h4>Assembly Errors ({diagnostics.length}):</h4>
              <ul>
                {diagnostics.map((err, idx) => (
                  <li key={idx}>
                    <strong>Line {err.lineNumber}:</strong> {err.message}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="binary-table">
              {binaryLines.length > 0 ? (
                binaryLines.map((bin, idx) => (
                  <div key={idx} className="binary-row">
                    <span className="rom-address">
                      ROM[{idx.toString().padStart(4, '0')}]
                    </span>
                    <span className="binary-code">{bin}</span>
                  </div>
                ))
              ) : (
                <span className="empty-message">// No executable instructions</span>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;