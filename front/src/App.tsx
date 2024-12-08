import { useRef, useState } from "react";
import "./App.css";
import { mf98Transformer } from "../../src/transformer/mf97";

function App() {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [shownText, setShownText] = useState<string>("");

  const handleTransform = () => {
    if (!textareaRef.current) return;
    const text = textareaRef.current.value;
    const lines = text.split("\n");
    const transformedText = lines
      .map((line) => mf98Transformer(line))
      .join("\n");
    setShownText(transformedText);
  };

  const handleCopy = () => {
    const text = document.getElementById("shownText")?.textContent;
    if (!text) return;
    navigator.clipboard.writeText(text);
    alert("クリップボードにコピーしました");
  };

  return (
    <>
      <div className="container">
        <textarea ref={textareaRef} placeholder="Enter text here"></textarea>
        <button onClick={handleTransform}>変換する</button>
      </div>
      <div>
        <button onClick={handleCopy}>クリップボードにコピー</button>
        <div className="container" id="shownText">
          {shownText}
        </div>
      </div>
    </>
  );
}

export default App;
