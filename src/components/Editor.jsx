import MonacoEditor from "@monaco-editor/react";
import { useRef } from "react";

export default function Editor({ code, onChange, currentLine }) {
    const editorRef = useRef(null);
    const decorationsRef = useRef([]);

    function handleMount(editor) {
        editorRef.current = editor;
    }

    function highlightLine(lineNumber) {
        if (!editorRef.current || !lineNumber) return;

        decorationsRef.current = editorRef.current.deltaDecorations(
            decorationsRef.current,
            [{
                range: { startLineNumber: lineNumber, endLineNumber: lineNumber, startColumn: 1, endColumn: 1 },
                options: {
                    isWholeLine: true,
                    className: 'active-line-highlight',
                    glyphMarginClassName: 'active-line-glyph'
                }
            }]
        );
    }

    if (currentLine) {
        highlightLine(currentLine);
    }

    return (
        <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
            <MonacoEditor
                height="100%"
                language="javascript"
                value={code}
                onChange={onChange}
                onMount={handleMount}
                theme="vs-dark"
                options={{
                    fontSize: 14,
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    lineNumbers: 'on',
                    glyphMargin: true,
                }}
            />
        </div>
    );
};