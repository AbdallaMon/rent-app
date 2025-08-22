import { useEffect, useRef, useState } from "react";

const TinyMCEEditor = ({ description, setDescription }) => {
  const editorRef = useRef(null);

  useEffect(() => {
    // Check if TinyMCE script is already loaded
    if (typeof window === "undefined") return;
    if (!window.tinymce) {
      // Load TinyMCE script dynamically
      const script = document.createElement("script");
      script.src = "/tinymce/tinymce.min.js";
      script.async = true;
      script.onload = () => {
        initializeEditor();
      };

      document.body.appendChild(script);
    } else {
      initializeEditor();
    }
  }, [description, setDescription]);

  const initializeEditor = () => {
    tinymce.init({
      selector: "textarea",
      height: "29.5cm",
      directionality: "rtl",
      menubar: "file edit insert view format table tools",
      fontsize_formats: "8pt 10pt 12pt 14pt 18pt 24pt 36pt",
      setup: (editor) => {
        if (description) {
          editor.on("init", () => {
            editor.setContent(description);
          });
        }

        editor.on("change", () => {
          const content = editor.getContent();
          setDescription(content);
        });
      },
      content_style: `
        .bordered-content { border: 2px solid black; padding: 0; }
        body { direction: rtl; text-align: right; width: 25.5cm; }
        p, div, h1, h2, h3, h4, h5, h6, span { direction: rtl; text-align: right; }
      `,
      language: "ar",
    });
  };

  return (
    <div style={{ margin: "auto", width: "20.2cm" }}>
      <textarea
        ref={editorRef}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
    </div>
  );
};

export default TinyMCEEditor;
