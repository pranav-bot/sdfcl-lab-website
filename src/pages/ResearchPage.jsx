import { useCallback, useEffect, useState } from "react";
import "./ResearchPage.css";
import { createClient } from "@supabase/supabase-js";

// Define heading + content fonts
const headingfont = {
  fontFamily: "Space Mono",
  fontWeight: 800,
};

const contentFont = { fontFamily: "Poppins", fontWeight: 300 };

// Supabase client for loading research data.
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
);


function ResearchPage() {
  const [researchItems, setResearchItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const mapImage = (img) => {
    if (!img || typeof img !== "string") return "";
    if (img.startsWith("http") || img.startsWith("/")) return img;
    return supabase.storage.from("assets").getPublicUrl(img).data.publicUrl;
  };

  const loadResearch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: loadError } = await supabase
        .from("research_information")
        .select("*")
        .order("created_at", { ascending: false });

      if (loadError) throw loadError;

      const rows = Array.isArray(data) ? data : [];
      const withUrls = rows.map((row) => ({
        ...row,
        image: mapImage(row.img_url || ""),
      }));
      setResearchItems(withUrls);
    } catch (err) {
      setError(err?.message || String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadResearch();
  }, [loadResearch]);

  const lowerSearch = searchTerm.toLowerCase();
  const filteredResearch = researchItems.filter(
    (item) =>
      (item.name || "").toLowerCase().includes(lowerSearch) ||
      (item.description || "").toLowerCase().includes(lowerSearch),
  );

  return (
    <div className="projects-page-container research-page-container fade-in-up">
      <div style={{ maxWidth: 600, margin: "0 auto 24px" }}>
        <input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search research..."
          style={{
            width: "100%",
            padding: "10px 12px",
            borderRadius: 8,
            border: "1px solid #ccc",
            background: "#011317",
            color: "white",
          }}
        />
      </div>

      {loading ? (
        <p style={{ color: "white", textAlign: "center" }}>
          Loading research information...
        </p>
      ) : error ? (
        <p style={{ color: "salmon", textAlign: "center" }}>
          Error loading research information: {error}
        </p>
      ) : filteredResearch.length > 0 ? (
        <>
          <h2 style={{ ...headingfont, color: "white", marginTop: 8 }}>
            Research
          </h2>
          <div className="projects-list">
            {filteredResearch.map((item) => (
              <div key={item.id} className="project-row">
                <div className="project-left">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name || "Research image"}
                      className="project-image"
                    />
                  ) : (
                    <div className="project-image research-image-placeholder">
                      No image
                    </div>
                  )}
                </div>
                <div className="project-right">
                  <h3 className="project-title">{item.name || "Untitled"}</h3>
                  <p className="project-desc" style={contentFont}>
                    {item.description || "No description available."}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <p style={{ color: "#c7efe7", textAlign: "center" }}>
          No research entries found.
        </p>
      )}
    </div>
  );
}

export default ResearchPage;