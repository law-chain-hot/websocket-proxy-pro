import React, { useState, useMemo, useCallback } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { json } from "@codemirror/lang-json";
import { oneDark } from "@codemirror/theme-one-dark";
import { EditorView } from "@codemirror/view";
import { EditorState } from "@codemirror/state";
import {
  WrapText,
  Minimize2,
  Hash,
  Copy,
  Edit,
  CheckCircle,
  SquareStack,
} from "lucide-react";
import "../styles/JsonViewer.css";

const JsonViewer = ({
  data,
  className = "",
  showControls = true,
  onCopy = null,
  copyButtonText = "📋 Copy",
  copiedText = "✓ Copied",
  isCopied = false,
  readOnly = true,
  onChange = null,
  enableWrap = true,
  enableCompact = true,
  enableNestedParse = true,
}) => {
  const [textWrap, setTextWrap] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [nestedParse, setNestedParse] = useState(false);

  // Recursively parse nested JSON strings
  const parseNestedJson = useCallback((obj) => {
    if (typeof obj === "string") {
      try {
        const parsed = JSON.parse(obj);
        // Recursively parse nested JSON
        return parseNestedJson(parsed);
      } catch {
        return obj;
      }
    } else if (Array.isArray(obj)) {
      return obj.map((item) => parseNestedJson(item));
    } else if (obj && typeof obj === "object") {
      const result = {};
      for (const [key, value] of Object.entries(obj)) {
        result[key] = parseNestedJson(value);
      }
      return result;
    }
    return obj;
  }, []);

  // Detect and parse JSON
  const { isValidJson, parsedData, displayData, nestedParsedData } =
    useMemo(() => {
      if (!data || typeof data !== "string") {
        return {
          isValidJson: false,
          parsedData: null,
          displayData: String(data || ""),
          nestedParsedData: null,
        };
      }

      try {
        const parsed = JSON.parse(data);
        const nestedParsed = parseNestedJson(parsed);
        return {
          isValidJson: true,
          parsedData: parsed,
          displayData: data,
          nestedParsedData: nestedParsed,
        };
      } catch {
        return {
          isValidJson: false,
          parsedData: null,
          displayData: data,
          nestedParsedData: null,
        };
      }
    }, [data, parseNestedJson]);

  // Get display content
  const getDisplayContent = () => {
    if (!isValidJson) {
      return displayData;
    }

    // Apply formatting and transformations
    const jsonData = nestedParse ? nestedParsedData : parsedData;
    return JSON.stringify(jsonData, null, collapsed ? 0 : 2);
  };

  const handleCopyClick = () => {
    if (onCopy) {
      const copyData = getDisplayContent();
      onCopy(copyData);
    }
  };

  const handleChange = useCallback(
    (value) => {
      if (onChange && !readOnly) {
        onChange(value);
      }
    },
    [onChange, readOnly]
  );

  // Handle formatting changes in edit mode
  const handleFormatChange = useCallback(
    (newCollapsed, newNestedParse) => {
      if (!readOnly && onChange && isValidJson) {
        try {
          const jsonData = newNestedParse ? nestedParsedData : parsedData;
          const formattedContent = JSON.stringify(
            jsonData,
            null,
            newCollapsed ? 0 : 2
          );
          onChange(formattedContent);
        } catch (error) {
          console.error("Error formatting JSON:", error);
        }
      }
    },
    [readOnly, onChange, isValidJson, nestedParsedData, parsedData]
  );

  const handleCollapsedChange = useCallback(
    (e) => {
      const newCollapsed = e.target.checked;
      setCollapsed(newCollapsed);
      handleFormatChange(newCollapsed, nestedParse);
    },
    [handleFormatChange, nestedParse]
  );

  const handleNestedParseChange = useCallback(
    (e) => {
      const newNestedParse = e.target.checked;
      setNestedParse(newNestedParse);
      handleFormatChange(collapsed, newNestedParse);
    },
    [handleFormatChange, collapsed]
  );

  const content = getDisplayContent();

  // CodeMirror extensions configuration
  const extensions = [
    isValidJson ? json() : [],
    EditorView.theme({
      "&": {
        fontSize: "12px",
        height: "100%",
        backgroundColor: "#262626", // 编辑器背景色
      },
      ".cm-editor": {
        height: "100%",
      },
      ".cm-scroller": {
        fontFamily:
          'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
        lineHeight: "1.3",
        overflow: "auto",
      },
      ".cm-focused": {
        outline: "none",
      },
      ".cm-editor.cm-focused": {
        outline: "none",
      },
      ".cm-content": {
        padding: "8px",
        minHeight: "100%",
      },
      ".cm-gutters": {
        backgroundColor: "#333333", // 行号区域背景色
        borderRight: "1px solid #404040",
      },
      "&.cm-editor.cm-focused .cm-selectionBackground": {
        backgroundColor: "rgba(0, 122, 204, 0.3)",
      },
      ".cm-line": {
        lineHeight: "1.3",
      },
    }),
    textWrap ? EditorView.lineWrapping : [],
    EditorView.editable.of(!readOnly),
    EditorState.readOnly.of(readOnly),
  ].filter(Boolean);

  return (
    <div className={`json-viewer ${className}`}>
      {showControls && (
        <div className="json-viewer-controls">
          <div className="json-viewer-controls-left">
            {enableWrap && (
              <button
                onClick={() => setTextWrap(!textWrap)}
                className={`json-viewer-btn ${
                  textWrap
                    ? "json-viewer-btn-active-green"
                    : "json-viewer-btn-inactive"
                }`}
                title="Wrap Text"
              >
                <WrapText size={14} />
                <span>Wrap</span>
              </button>
            )}

            {isValidJson && enableCompact && (
              <button
                onClick={() => {
                  const newCollapsed = !collapsed;
                  setCollapsed(newCollapsed);
                  handleFormatChange(newCollapsed, nestedParse);
                }}
                className={`json-viewer-btn ${
                  collapsed
                    ? "json-viewer-btn-active-orange"
                    : "json-viewer-btn-inactive"
                }`}
                title="Compact"
              >
                <Minimize2 size={14} />
                <span>Compact</span>
              </button>
            )}

            {isValidJson && enableNestedParse && (
              <button
                onClick={() => {
                  const newNestedParse = !nestedParse;
                  setNestedParse(newNestedParse);
                  handleFormatChange(collapsed, newNestedParse);
                }}
                className={`json-viewer-btn ${
                  nestedParse
                    ? "json-viewer-btn-active-purple"
                    : "json-viewer-btn-inactive"
                }`}
                title="Nested Parse JSON"
              >
                <SquareStack size={14} />
                <span>Nested Parse</span>
              </button>
            )}

            {onCopy && (
              <>
                <div className="json-viewer-divider" />
                <button
                  onClick={handleCopyClick}
                  className={`json-viewer-btn ${
                    isCopied
                      ? "json-viewer-btn-active-blue"
                      : "json-viewer-btn-inactive"
                  }`}
                  title="Copy"
                >
                  <Copy size={14} />
                  <span>Copy</span>
                </button>
              </>
            )}
          </div>

          <div className="json-viewer-controls-right">
            {/* Status badges on the right */}
            {!readOnly && (
              <div className="json-viewer-badge json-viewer-badge-yellow">
                <Edit size={12} />
                <span>Edit</span>
              </div>
            )}

            {readOnly && isValidJson && (
              <div className="json-viewer-badge json-viewer-badge-green">
                <CheckCircle size={12} />
                <span>JSON</span>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="json-viewer-container">
        <CodeMirror
          value={content}
          onChange={handleChange}
          extensions={extensions}
          theme={oneDark}
          basicSetup={{
            lineNumbers: true,
            foldGutter: true,
            dropCursor: false,
            allowMultipleSelections: false,
            indentOnInput: !readOnly,
            bracketMatching: true,
            closeBrackets: !readOnly,
            autocompletion: !readOnly,
            highlightSelectionMatches: false,
            searchKeymap: true,
          }}
          className="json-viewer-codemirror"
        />
      </div>
    </div>
  );
};

export default JsonViewer;
