"use client";
import "./globals.css";



import { useState } from "react";







function parseAnalysis(text: string) {
  const getSection = (label: string) => {
    const regex = new RegExp(`${label}:([\\s\\S]*?)(\\n\\n|$)`);
    return regex.exec(text)?.[1]?.trim() ?? "Not provided";
  };

  return {
    confidence: getSection("Confidence"),
    organism: getSection("Likely Organism"),
    features: getSection("Key Visual Features"),
    uncertainty: getSection("Uncertainty Notes"),
  };
}




function getConfidenceColor(confidence: string) {
  const num = parseFloat(confidence); // expects something like "0.85" or "85%"
  if (isNaN(num)) return "#fef3c7"; // default if AI gives no number

  const value = num > 1 ? num / 100 : num; // normalize percentages >1

  if (value >= 0.8) return "#16a34a"; // green
  if (value >= 0.5) return "#eab308"; // yellow
  return "#dc2626"; // red
}


export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showScroll, setShowScroll] = useState(false);

  





  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
  confidence: false,
  organism: false,
  features: false,
  uncertainty: false,
});


  function getConfidenceBlurb(conf: string) {
    if (conf.toLowerCase().includes("high")) return "AI is very confident in this assessment.";
    if (conf.toLowerCase().includes("medium")) return "AI suggests this, but some uncertainty remains.";
    if (conf.toLowerCase().includes("low")) return "AI is unsure; treat this as tentative.";
    return "Confidence Measure";
  }

  // <-- toggleSection must be inside Home
  function toggleSection(key: string) {
    setOpenSections((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  }








  

  
  async function handleSubmit() {
    if (!file) return;

    setLoading(true);
    setResult(null);
        // clear previous Groq output
    setShowScroll(false);     // hide scroll indicator while analyzing

    try {
      const formData = new FormData();
      formData.append("image", file);

      // 1️⃣ OpenAI analysis
      const res = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Analyze request failed");
      }

      const data = await res.json();
      setResult(data.result);

      
      



    } finally {
      // 🔴 ALWAYS stop the spinner
      setLoading(false);
      setShowScroll(true); // show scroll indicator even on error
    }
  }



  return (
    <main style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>MicroVision AI</h1>
        <p style={styles.subtitle}>
          AI-assisted microscopy analysis for education & research
        </p>

        <label style={styles.uploadBox}>
          <input
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => {
              const selectedFile = e.target.files?.[0] || null;
              setFile(selectedFile);

              if (selectedFile) {
                setPreviewUrl(URL.createObjectURL(selectedFile));
              } else {
                setPreviewUrl(null);
              }
            }}
          />

          

          {file ? file.name : "Click to upload a microscopy image"}
        </label>

        <button
          onClick={handleSubmit}
          disabled={loading || !file}
          style={{
            ...styles.button,
            opacity: loading || !file ? 0.6 : 1,
          }}
        >
          {loading ? "Analyzing..." : "Analyze Image"}
        </button>
        {loading && (
          <div style={{ marginTop: "1rem", textAlign: "center" }}>
            <div style={styles.spinner} />
            <p style={{ color: "#94a3b8", fontSize: "0.85rem", fontWeight: "bold", marginBottom: "3rem" }}>
              Analyzing image…
            </p>

          </div>
)}

        {showScroll && (
            <div style={styles.scrollIndicator}>
              ⬇ Scroll down for Results ⬇
            </div>
          )}


        {previewUrl && (
          <div style={styles.imagePreview}>
            <img src={previewUrl} alt="Uploaded image preview" style={styles.thumbnail} />
          </div>
        )}


        {result && (() => {
  const parsed = parseAnalysis(result);

  return (
    <>
      <div style={styles.resultBox}>
        <h3>Analysis Result</h3>

        {/* Confidence Section */}
        <div style={styles.section}>
          <div
            style={{
              ...styles.sectionTitle,
              cursor: "pointer",
            }}
            onClick={() => toggleSection("confidence")}
          >
            Confidence {openSections["confidence"] ? "▲" : "▼"}
          </div>

          {openSections["confidence"] && (
            <div style={styles.sectionContent}>
              <div
                style={{
                  color: getConfidenceColor(parsed.confidence),
                  fontWeight: 600,
                  marginBottom: "0.5rem",
                }}
              >
                {parsed.confidence}
              </div>
              <div
                style={{
                  fontSize: "0.85rem",
                  color: "#cbd5f5",
                  marginBottom: "0.5rem",
                }}
              >
                {getConfidenceBlurb(parsed.confidence)}
              </div>
              <p
                style={{
                  fontSize: "0.8rem",
                  color: "#94a3b8",
                  lineHeight: 1.4,
                }}
              >
                This indicates how certain the AI is about its analysis. High confidence
                means the AI is confident in the identified structures or organisms, medium
                confidence indicates some ambiguity, and low confidence suggests the result
                should be treated with caution.
              </p>
            </div>
          )}
        </div>

        {/* Likely Organism Section */}
        <div style={styles.section}>
          <div
            style={styles.sectionHeader}
            onClick={() => toggleSection("organism")}
          >
            <div style={styles.sectionTitle}>Likely Organism</div>
            <div style={styles.caret}>{openSections.organism ? "▾" : "▸"}</div>
          </div>

          <div style={styles.sectionContent}>{parsed.organism}</div>

          {openSections.organism && (
            <div style={styles.expandedContent}>
              <p style={{ margin: 0 }}>
                This classification is inferred from observed morphology, staining patterns,
                and structural consistency with known reference samples. Confidence increases
                when multiple visual indicators align.
              </p>
            </div>
          )}
        </div>

        {/* Key Visual Features */}
        <div style={styles.section}>
          <div style={styles.sectionTitle}>Key Visual Features</div>
          <div style={styles.sectionContent}>
            <pre style={styles.resultText}>{parsed.features}</pre>
          </div>
        </div>

        {/* Uncertainty Notes */}
        <div style={styles.section}>
          <div style={styles.sectionTitle}>Uncertainty Notes</div>
          <div style={styles.sectionContent}>{parsed.uncertainty}</div>
        </div>
      </div>

      






    </>
  );
})()
}


      </div>

      <style jsx global>{`
      @keyframes spin {
        0% {
          transform: rotate(0deg);
        }
        100% {
          transform: rotate(360deg);
        }
      }
    `}</style>

    </main>
  );
}





const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #0f172a, #020617)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily:
      "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial",
    color: "#e5e7eb",
  },
  card: {
    background: "#020617",
    padding: "2.5rem",
    borderRadius: "16px",
    width: "100%",
    maxWidth: "480px",
    boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
    border: "1px solid #1e293b",
  },
  title: {
    fontSize: "2rem",
    fontWeight: 700,
    marginBottom: "0.25rem",
  },
  subtitle: {
    fontSize: "0.9rem",
    color: "#94a3b8",
    marginBottom: "1.5rem",
  },
  uploadBox: {
    display: "block",
    padding: "1rem",
    borderRadius: "10px",
    border: "2px dashed #334155",
    textAlign: "center" as const,
    cursor: "pointer",
    marginBottom: "1.5rem",
    color: "#cbd5f5",
  },
  button: {
    width: "100%",
    padding: "0.75rem",
    borderRadius: "10px",
    border: "none",
    background: "#2563eb",
    color: "white",
    fontSize: "1rem",
    fontWeight: 600,
    cursor: "pointer",
    marginBottom: "1.5rem",
  },
  resultBox: {
    background: "#020617",
    border: "1px solid #1e293b",
    borderRadius: "10px",
    padding: "1rem",
    marginTop: "1rem",
  },
  resultText: {
    whiteSpace: "pre-wrap" as const,
    fontSize: "0.85rem",
    color: "#e5e7eb",
  },

  // NEW STYLES FOR CARDS
  section: {
    marginTop: "1rem",
    padding: "0.75rem 1rem",
    borderRadius: "10px",
    background: "#111827", // slightly lighter than main card
    border: "1px solid #334155",
  },
  sectionTitle: {
    fontSize: "0.75rem",
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
    color: "#94a3b8",
    marginBottom: "0.25rem",
  },
  sectionContent: {
    fontSize: "0.9rem",
    color: "#e5e7eb",
  },


  imagePreview: {
  textAlign: "center" as const,
  marginBottom: "1rem",
},
thumbnail: {
  maxWidth: "100%",
  borderRadius: "10px",
  border: "1px solid #334155",
  boxShadow: "0 5px 15px rgba(0,0,0,0.3)",
},


spinner: {
  border: "6px solid #1e293b",
  borderTop: "6px solid #2563eb", // blue highlight
  borderRadius: "50%",
  width: "40px",
  height: "40px",
  animation: "spin 0.3s ease-out infinite",
  margin: "0 auto 1rem",
},

sectionHeader: {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  cursor: "pointer",
  marginBottom: "0.5rem",
},
sectionHeaderHover: {
  background: "#5d647bff", // hover color
},

caret: {
  fontSize: "0.9rem",
  color: "#94a3b8",
},

expandedContent: {
  background: "#0f172a",
  border: "1px solid #334155",
  borderRadius: "8px",
  padding: "0.75rem 1rem",
  marginTop: "0.5rem",
  color: "#cbd5f5",
  fontSize: "0.85rem",
  lineHeight: 1.4,
},

scrollIndicator: {
    textAlign: "center" as const,    // tells TS this is exactly "center"
    color: "#94a3b8",
    fontWeight: 600,
    marginTop: "1rem",
    animation: "bounce 1s infinite" as const, // same here
  },


};




