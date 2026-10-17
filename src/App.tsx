import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import type * as MonacoType from 'monaco-editor';
import { registerHackLanguage } from './editor/hackLanguage';
import { assembleHackSource } from './core/assembler';
import { PRELOADED_EXAMPLES } from './core/examples';
import { DocsModal } from './components/DocsModal';
import { SymbolTableInspector } from './components/SymbolTableInspector';
import './App.css';

export interface CategorizedSymbol {
  name: string;
  address: number;
  type: 'label' | 'variable' | 'predefined';
}

const HACK_ROM_CAPACITY = 32768;

const PREDEFINED_SYMBOLS = new Set([
  'SP', 'LCL', 'ARG', 'THIS', 'THAT',
  'SCREEN', 'KBD',
  'R0', 'R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7',
  'R8', 'R9', 'R10', 'R11', 'R12', 'R13', 'R14', 'R15'
]);

const parseAllSymbols = (rawTable: any): CategorizedSymbol[] => {
  if (!rawTable) return [];

  const table: Record<string, number> =
    typeof rawTable.getTable === 'function'
      ? rawTable.getTable()
      : rawTable.symbols && typeof rawTable.symbols === 'object'
      ? rawTable.symbols
      : rawTable;

  const result: CategorizedSymbol[] = [];

  for (const [name, address] of Object.entries(table)) {
    if (typeof address !== 'number' || name === 'nextVariableAddress' || name === 'symbols') {
      continue;
    }

    let type: 'label' | 'variable' | 'predefined' = 'variable';
    if (PREDEFINED_SYMBOLS.has(name)) {
      type = 'predefined';
    } else if (address < 16) {
      type = 'label';
    } else {
      type = 'variable';
    }

    result.push({ name, address, type });
  }

  return result;
};

const normalizeAssemblyCode = (rawText: string): string => {
  return rawText
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line !== '')
    .join('\n');
};

export function App() {
  const [sourceCode, setSourceCode] = useState<string>(PRELOADED_EXAMPLES[0].code);
  const [currentFileName, setCurrentFileName] = useState<string>(PRELOADED_EXAMPLES[0].filename);
  const [selectedExampleId, setSelectedExampleId] = useState<string>('add');
  const [isSymbolTableOpen, setIsSymbolTableOpen] = useState<boolean>(false);
  const [isDocsOpen, setIsDocsOpen] = useState<boolean>(false);
  const [copyStatus, setCopyStatus] = useState<string>('Copy Binary');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<MonacoType.editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<typeof MonacoType | null>(null);

  const { binaryLines, diagnostics, symbolTable } = useMemo(() => {
    return assembleHackSource(sourceCode);
  }, [sourceCode]);

  const parsedSymbols = useMemo(() => {
    return parseAllSymbols(symbolTable || {});
  }, [symbolTable]);

  const currentExample = useMemo(() => {
    return PRELOADED_EXAMPLES.find((ex) => ex.id === selectedExampleId);
  }, [selectedExampleId]);

  const testStatus = useMemo(() => {
    if (!currentExample?.expectedBinary || diagnostics.length > 0) return null;
    if (binaryLines.length !== currentExample.expectedBinary.length) {
      return {
        passed: false,
        message: `Length mismatch: ${binaryLines.length} vs expected ${currentExample.expectedBinary.length}`,
      };
    }
    const mismatchIdx = binaryLines.findIndex(
      (line, i) => line !== currentExample.expectedBinary![i]
    );
    if (mismatchIdx !== -1) {
      return { passed: false, message: `Mismatch at ROM[${mismatchIdx}]` };
    }
    return { passed: true, message: '100% Matches Reference .cmp Binary' };
  }, [currentExample, binaryLines, diagnostics]);

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
        setSourceCode(normalizeAssemblyCode(content));
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleDownloadHack = useCallback(() => {
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
  }, [binaryLines, diagnostics, currentFileName]);

  const handleCopyBinary = async () => {
    if (binaryLines.length === 0 || diagnostics.length > 0) return;
    try {
      await navigator.clipboard.writeText(binaryLines.join('\n'));
      setCopyStatus('Copied!');
      setTimeout(() => setCopyStatus('Copy Binary'), 2000);
    } catch {
      setCopyStatus('Failed to copy');
      setTimeout(() => setCopyStatus('Copy Binary'), 2000);
    }
  };

  const handleJumpToSymbol = (symbolName: string) => {
    if (!editorRef.current) return;
    const model = editorRef.current.getModel();
    if (!model) return;

    const matches = model.findMatches(symbolName, true, false, true, null, true);
    if (matches.length > 0) {
      const target = matches[0].range;
      editorRef.current.revealRangeInCenter(target);
      editorRef.current.setSelection(target);
      editorRef.current.focus();
    }
  };

  const romPercentage = ((binaryLines.length / HACK_ROM_CAPACITY) * 100).toFixed(2);

  return (
    <div className="ide-container">
      <header className="ide-header">
        <div className="header-left">
          <h1>Hack Assembly IDE & Assembler</h1>
          <span className="file-badge">{currentFileName}</span>

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

          <button className="btn btn-secondary" onClick={() => setIsDocsOpen(true)}>
            Cheatsheet / Docs
          </button>

          <button
            className="btn btn-secondary"
            onClick={() => setIsSymbolTableOpen(!isSymbolTableOpen)}
          >
            {isSymbolTableOpen ? 'Close Symbols' : 'Symbol Table'}
          </button>

          <button
            className="btn btn-secondary"
            onClick={handleCopyBinary}
            disabled={diagnostics.length > 0 || binaryLines.length === 0}
          >
            {copyStatus}
          </button>

          <button
            className="btn btn-primary"
            onClick={handleDownloadHack}
            disabled={diagnostics.length > 0 || binaryLines.length === 0}
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
            <div className="preview-header-title">
              <h3>Machine Code Preview (.hack)</h3>
              <span className="instruction-count">
                {binaryLines.length} {binaryLines.length === 1 ? 'Word' : 'Words'}
              </span>
            </div>

            <div
              className="rom-meter-container"
              title={`ROM Usage: ${binaryLines.length} / ${HACK_ROM_CAPACITY} instructions`}
            >
              <span className="rom-meter-label">ROM: {romPercentage}%</span>
              <div className="rom-progress-bar">
                <div
                  className="rom-progress-fill"
                  style={{ width: `${Math.min(parseFloat(romPercentage), 100)}%` }}
                />
              </div>
            </div>
          </div>

          {testStatus && (
            <div className={`test-status-banner ${testStatus.passed ? 'passed' : 'failed'}`}>
              <span className="status-icon">{testStatus.passed ? '✓' : '✗'}</span>
              <span>{testStatus.message}</span>
            </div>
          )}

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

        <SymbolTableInspector
          isOpen={isSymbolTableOpen}
          onClose={() => setIsSymbolTableOpen(false)}
          symbols={parsedSymbols}
          onSelectSymbol={handleJumpToSymbol}
        />
      </main>

      <DocsModal isOpen={isDocsOpen} onClose={() => setIsDocsOpen(false)} />
    </div>
  );
}

export default App;