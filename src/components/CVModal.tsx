
import { useEffect, useState } from "react";
import { FileText, Download, X, ExternalLink } from "lucide-react";
import "../CVModal.css";

const CV_URL = "cv/Charles_Mwangi_Kamau_CV.pdf";

export default function CVModal() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event:any) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <>
      <button
        type="button"
        className="view-cv-btn"
        onClick={() => setIsOpen(true)}
      >
        <FileText size={16} aria-hidden="true" />
        <span>View CV</span>
      </button>

      {isOpen && (
        <div
          className="cv-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setIsOpen(false);
            }
          }}
        >
          <section
            className="cv-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="cv-modal-title"
          >
            <header className="cv-modal-header">
              <div className="cv-modal-heading">
                <FileText
                  size={20}
                  className="cv-modal-icon"
                  aria-hidden="true"
                />

                <div>
                  <h2 id="cv-modal-title">Curriculum Vitae</h2>
                  <p>Charles Mwangi Kamau</p>
                </div>
              </div>

              <div className="cv-modal-actions">
                <a
                  className="cv-action-btn cv-download-btn"
                  href={CV_URL}
                  download="Charles-Mwangi-Kamau-CV.pdf"
                >
                  <Download size={16} aria-hidden="true" />
                  <span>Download</span>
                </a>

                <a
                  className="cv-action-btn cv-external-btn"
                  href={CV_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Open CV in a new tab"
                  title="Open in new tab"
                >
                  <ExternalLink size={16} aria-hidden="true" />
                </a>

                <button
                  type="button"
                  className="cv-action-btn cv-close-btn"
                  onClick={() => setIsOpen(false)}
                  aria-label="Close CV viewer"
                  title="Close"
                  autoFocus
                >
                  <X size={18} aria-hidden="true" />
                </button>
              </div>
            </header>

            <div className="cv-modal-viewer">
              <iframe
                src={CV_URL}
                title="Charles Mwangi Kamau CV"
                className="cv-pdf-frame"
              />

              <noscript>
                JavaScript is required to use this CV viewer.
              </noscript>
            </div>

            <footer className="cv-modal-footer">
              <span>PDF Document</span>
            </footer>
          </section>
        </div>
      )}
    </>
  );
}
