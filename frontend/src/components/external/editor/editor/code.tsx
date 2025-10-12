import Editor from "@monaco-editor/react";
import styled from "@emotion/styled";
import { File } from "../utils/file-manager";
import { Socket } from "socket.io-client";

export const Code = ({ selectedFile, socket }: { selectedFile: File | undefined, socket: Socket }) => {
  if (!selectedFile)
    return null

  const code = selectedFile.content
  let language = selectedFile.name.split('.').pop()

  if (language === "js" || language === "jsx")
    language = "javascript";
  else if (language === "ts" || language === "tsx")
    language = "typescript"
  else if (language === "py" )
    language = "python"

    function debounce(func: (value: string) => void, wait: number) {
      let timeout: number | undefined;
      return (value: string) => {
        if (timeout) window.clearTimeout(timeout);
        timeout = window.setTimeout(() => {
          func(value);
        }, wait);
      };
    }

  return (
    <Container>
      <Header>
        <FileName title={selectedFile.path}>{selectedFile.name}</FileName>
        <LangBadge>{language}</LangBadge>
      </Header>
      <EditorWrapper>
        <Editor
          height="100%"
          width="100%"
          language={language}
          value={code}
          theme="vs-dark"
          onChange={(v) => {
            const debounced = debounce((value: string) => {
              socket.emit("updateContent", { path: selectedFile.path, content: value });
            }, 500);
            debounced(v ?? "");
          }}
          options={{ minimap: { enabled: false } }}
        />
      </EditorWrapper>
    </Container>
  )
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  flex: 1 1 auto;
  min-width: 0;
  min-height: 0;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 40px;
  padding: 0 12px;
  background: #1f2937;
  border-bottom: 1px solid #374151;
  color: #e5e7eb;
`;

const EditorWrapper = styled.div`
  flex: 1 1 auto;
  min-height: 0;
  min-width: 0;
  display: flex;
`;

const FileName = styled.div`
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const LangBadge = styled.span`
  font-size: 12px;
  color: #93c5fd;
  background: rgba(59, 130, 246, 0.12);
  border: 1px solid rgba(59, 130, 246, 0.35);
  padding: 2px 8px;
  border-radius: 999px;
  text-transform: capitalize;
`;
