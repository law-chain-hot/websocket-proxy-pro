import React, { useState, useMemo, useCallback, useEffect } from "react";
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
  Star,
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
  enableNestedParse = true,
  onAddToFavorites = null,
  showFavoritesButton = false,
}) => {
  const [textWrap, setTextWrap] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [nestedParse, setNestedParse] = useState(true);
  const [forceUpdate, setForceUpdate] = useState(0);

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
  const {
    isValidJson,
    parsedData,
    displayData,
    nestedParsedData,
    hasNestedData,
  } = useMemo(() => {
    console.log(
      "🔍 JsonViewer: Recalculating data for:",
      data?.substring(0, 100) + "..."
    );

    if (!data || typeof data !== "string") {
      return {
        isValidJson: false,
        parsedData: null,
        displayData: String(data || ""),
        nestedParsedData: null,
        hasNestedData: false,
      };
    }

    try {
      const parsed = JSON.parse(data);
      const nestedParsed = parseNestedJson(parsed);

      // Check if nested parsing actually found nested JSON
      const hasNestedData =
        JSON.stringify(parsed) !== JSON.stringify(nestedParsed);

      console.log("🔍 JsonViewer: Parsed data", {
        hasNestedData,
        parsedDataLength: JSON.stringify(parsed).length,
        nestedParsedDataLength: JSON.stringify(nestedParsed).length,
      });

      return {
        isValidJson: true,
        parsedData: parsed,
        displayData: data,
        nestedParsedData: nestedParsed,
        hasNestedData,
      };
    } catch {
      return {
        isValidJson: false,
        parsedData: null,
        displayData: data,
        nestedParsedData: null,
        hasNestedData: false,
      };
    }
  }, [data, parseNestedJson, forceUpdate]);

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

  const handleAddToFavorites = () => {
    if (onAddToFavorites) {
      const favoriteData = getDisplayContent();
      onAddToFavorites(favoriteData);
    }
  };

  const handleChange = useCallback(
    (value) => {
      if (onChange && !readOnly) {
        if (nestedParse) {
          try {
            // Try to parse and apply nested parsing
            const parsed = JSON.parse(value);
            const nestedParsed = parseNestedJson(parsed);
            const formattedContent = JSON.stringify(
              nestedParsed,
              null,
              collapsed ? 0 : 2
            );
            onChange(formattedContent);
            return;
          } catch (error) {
            // If parsing fails, use original value
          }
        }
        onChange(value);
      }
    },
    [onChange, readOnly, nestedParse, parseNestedJson, collapsed]
  );

  // Handle formatting changes in edit mode
  const handleFormatChange = useCallback(
    (newCollapsed, newNestedParse) => {
      console.log("🔄 JsonViewer: handleFormatChange called", {
        newCollapsed,
        newNestedParse,
        readOnly,
        hasOnChange: !!onChange,
        isValidJson,
      });

      if (!readOnly && onChange && isValidJson) {
        try {
          const jsonData = newNestedParse ? nestedParsedData : parsedData;
          const formattedContent = JSON.stringify(
            jsonData,
            null,
            newCollapsed ? 0 : 2
          );
          console.log("🔄 JsonViewer: Calling onChange with formatted content");
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
    (newNestedParse) => {
      console.log("🔄 JsonViewer: handleNestedParseChange called", {
        newNestedParse,
        currentNestedParse: nestedParse,
        hasNestedData,
      });

      setNestedParse(newNestedParse);
      handleFormatChange(collapsed, newNestedParse);

      // Force a re-render to ensure UI updates
      setForceUpdate((prev) => prev + 1);
    },
    [handleFormatChange, collapsed, nestedParse, hasNestedData]
  );

  // Reset nestedParse when data changes and has no nested data
  useEffect(() => {
    if (isValidJson && !hasNestedData && nestedParse) {
      console.log(
        "🔄 JsonViewer: Auto-disabling nested parse (no nested data found)"
      );
      setNestedParse(false);
    }
  }, [isValidJson, hasNestedData, nestedParse]);

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

            {enableNestedParse && (
              <button
                onClick={() => {
                  const newNestedParse = !nestedParse;
                  handleNestedParseChange(newNestedParse);
                }}
                className={`json-viewer-btn ${
                  nestedParse
                    ? "json-viewer-btn-active-purple"
                    : "json-viewer-btn-inactive"
                } ${!hasNestedData ? "json-viewer-btn-disabled" : ""}`}
                title={
                  hasNestedData
                    ? "Nested Parse JSON"
                    : "No nested JSON data found"
                }
                disabled={!hasNestedData}
              >
                <SquareStack size={14} />
                <span>Nested Parse</span>
              </button>
            )}
          </div>

          <div className="json-viewer-controls-right">
            {/* Action buttons */}
            {(onCopy || showFavoritesButton) && (
              <div className="json-viewer-action-buttons">
                {onCopy && (
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
                )}

                {showFavoritesButton && onAddToFavorites && (
                  <button
                    onClick={handleAddToFavorites}
                    className="json-viewer-btn json-viewer-btn-inactive"
                    title="Add to Favorites"
                  >
                    <Star size={14} />
                    <span>Favorite</span>
                  </button>
                )}
              </div>
            )}

            {/* Divider if we have both action buttons and status badges */}
            {(onCopy || showFavoritesButton) &&
              (!readOnly || (readOnly && isValidJson) || hasNestedData) && (
                <div className="json-viewer-divider" />
              )}

            {/* Status badges */}
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

            {/* Debug info */}
            {hasNestedData && (
              <div className="json-viewer-badge json-viewer-badge-blue">
                <Hash size={12} />
                <span>Nested</span>
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
