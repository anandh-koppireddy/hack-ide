import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import type * as MonacoType from 'monaco-editor';
import { registerHackLanguage } from './editor/hackLanguage';
import { assembleHackSource } from './core/assembler';
import { PRELOADED_EXAMPLES } from './core/examples';
import { VirtualScreen } from './components/VirtualScreen';
import { CpuDebugger } from './components/CpuDebugger';
import { stepCpu, createInitialCpuState, type CpuState } from './core/cpu';
import { SCREEN_START_ADDR, SCREEN_END_ADDR } from './core/screen';
import './App.css';

const HACK_ROM_CAPACITY = 32768;
const HACK_RAM_CAPACITY = 32768;
const CYCLES_PER_FRAME = 1500; // Batch cycles for real-time responsiveness

const normalizeAssemblyCode = (rawText: string): string => {
  return rawText
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line !== '')
    .join('\n');
};

const categorizeSymbols = (symbolTable: Record<string, number>) => {
  const predefined: { name: string; address: number }[] = [];
  const labels: { name: string; address: number }[] = [];
  const variables: { name: string; address: number }[] = [];

  const predefinedNames = new Set([
    'SP', 'LCL', 'ARG', 'THIS', 'THAT',
    'SCREEN', 'KBD',
    'R0', 'R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7',
    'R8', 'R9', 'R10', 'R11', 'R12', 'R13', 'R14', 'R15'
  ]);

  Object.entries(symbolTable || {}).forEach(([name, address]) => {
    if (predefinedNames.has(name)) {
      predefined.push({ name, address });
    } else if (address >= 16) {
      variables.push({ name, address });
    } else {
      labels.push({ name, address });
    }
  });

  return { predefined, labels, variables };
};

export function App() {
  const [sourceCode, setSourceCode] = useState<string>(PRELOADED_EXAMPLES[0].code);
  const [currentFileName, setCurrentFileName] = useState<string>(PRELOADED_EXAMPLES[0].filename);
  const [selectedExampleId, setSelectedExampleId] = useState<string>('default');
  const [isSymbolTableOpen, setIsSymbolTableOpen] = useState<boolean>(false);
  const [copyStatus, setCopyStatus] = useState<string>('Copy Binary');

  // Emulator State
  const [ram, setRam] = useState<Int16Array>(() => new Int16Array(HACK_RAM_CAPACITY));
  const [cpuState, setCpuState] = useState<CpuState>(createInitialCpuState);
  const [isRunning, setIsRunning] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<MonacoType.editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<typeof MonacoType | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const { binaryLines, diagnostics, symbolTable } = useMemo(() => {
    return assembleHackSource(sourceCode);
  }, [sourceCode]);

  const categorized = useMemo(() => {
    return categorizeSymbols(symbolTable || {});
  }, [symbolTable]);

  // Synchronize Monaco Linter Markers
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
      handleResetCpu();
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
        const cleanedCode = normalizeAssemblyCode(content);
        setSourceCode(cleanedCode);
        handleResetCpu();
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

  const handleClearScreen = () => {
    setRam((prevRam) => {
      const updated = new Int16Array(prevRam);
      for (let addr = SCREEN_START_ADDR; addr <= SCREEN_END_ADDR; addr++) {
        updated[addr] = 0;
      }
      return updated;
    });
  };

  const handleStepCpu = () => {
    if (binaryLines.length === 0 || diagnostics.length > 0) return;
    setCpuState((prevCpu) => {
      const updatedRam = new Int16Array(ram);
      const nextCpu = stepCpu(prevCpu, binaryLines, updatedRam);
      setRam(updatedRam);
      return nextCpu;
    });
  };

  const handleResetCpu = () => {
    setIsRunning(false);
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    setCpuState(createInitialCpuState());
  };

  const handleRunToggle = () => {
    setIsRunning((prev) => !prev);
  };

  // Continuous run loop
  useEffect(() => {
    if (!isRunning) return;

    let localCpu = cpuState;
    const localRam = new Int16Array(ram);

    const runBatch = () => {
      for (let i = 0; i < CYCLES_PER_FRAME; i++) {
        if (localCpu.halted) {
          setIsRunning(false);
          break;
        }
        localCpu = stepCpu(localCpu, binaryLines, localRam);
      }

      setCpuState(localCpu);
      setRam(new Int16Array(localRam));

      if (!localCpu.halted) {
        animationFrameRef.current = requestAnimationFrame(runBatch);
      }
    };

    animationFrameRef.current = requestAnimationFrame(runBatch);

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isRunning, binaryLines]);

  // Keyboard shortcut Ctrl+S / Cmd+S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleDownloadHack();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleDownloadHack]);

  const romPercentage = ((binaryLines.length / HACK_ROM_CAPACITY) * 100).toFixed(2);

  return (
    <div className="ide-container">
      <header className="ide-header">
        <div className="header-left">
          <h1>Hack Assembly IDE & Linter</h1>
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
            title="Copy machine code to clipboard"
          >
            {copyStatus}
          </button>

          <button
            className="btn btn-primary"
            onClick={handleDownloadHack}
            disabled={diagnostics.length > 0 || binaryLines.length === 0}
            title={diagnostics.length > 0 ? 'Fix errors to download .hack binary' : 'Download binary (Ctrl+S)'}
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
              handleResetCpu();
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

            <div className="rom-meter-container" title={`ROM Usage: ${binaryLines.length} / ${HACK_ROM_CAPACITY} instructions`}>
              <span className="rom-meter-label">ROM: {romPercentage}%</span>
              <div className="rom-progress-bar">
                <div
                  className="rom-progress-fill"
                  style={{ width: `${Math.min(parseFloat(romPercentage), 100)}%` }}
                />
              </div>
            </div>
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
                  <div
                    key={idx}
                    className={`binary-row ${cpuState.pc === idx ? 'active-pc-row' : ''}`}
                  >
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

          {/* CPU Debugger Registers & Controls */}
          <CpuDebugger
            cpuState={cpuState}
            ram={ram}
            isRunning={isRunning}
            onStep={handleStepCpu}
            onRunToggle={handleRunToggle}
            onReset={handleResetCpu}
            disabled={diagnostics.length > 0 || binaryLines.length === 0}
          />

          {/* Virtual Screen */}
          <VirtualScreen ram={ram} onClearScreen={handleClearScreen} />
        </div>

        {/* Symbol Table Inspector Drawer */}
        {isSymbolTableOpen && (
          <aside className="symbol-drawer">
            <div className="drawer-header">
              <h3>Symbol Table Inspector</h3>
              <button className="close-btn" onClick={() => setIsSymbolTableOpen(false)}>×</button>
            </div>
            <div className="drawer-content">
              <div className="symbol-section">
                <h4>User Labels ({categorized.labels.length})</h4>
                {categorized.labels.length === 0 ? <p className="empty-sub">No user labels</p> : (
                  <table>
                    <thead><tr><th>Symbol</th><th>ROM Addr</th><th>Hex</th></tr></thead>
                    <tbody>
                      {categorized.labels.map(s => (
                        <tr key={s.name}>
                          <td>{s.name}</td>
                          <td>{s.address}</td>
                          <td>0x{s.address.toString(16).toUpperCase()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              <div className="symbol-section">
                <h4>Allocated RAM Variables ({categorized.variables.length})</h4>
                {categorized.variables.length === 0 ? <p className="empty-sub">No variables allocated</p> : (
                  <table>
                    <thead><tr><th>Variable</th><th>RAM Addr</th><th>Hex</th></tr></thead>
                    <tbody>
                      {categorized.variables.map(s => (
                        <tr key={s.name}>
                          <td>{s.name}</td>
                          <td>{s.address}</td>
                          <td>0x{s.address.toString(16).toUpperCase()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </aside>
        )}
      </main>
    </div>
  );
}

export default App;