import { useCallback, useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
);

function ResearchEditor() {
  const [researchItems, setResearchItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const loadResearchItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: loadError } = await supabase
        .from("research_information")
        .select("*")
        .order("created_at", { ascending: false });
      if (loadError) throw loadError;

      const mapped = (data || []).map((row) => ({
        ...row,
        previewUrl: row?.img_url
          ? row.img_url.startsWith("http") || row.img_url.startsWith("/")
            ? row.img_url
            : supabase.storage.from("assets").getPublicUrl(row.img_url).data
                .publicUrl
          : "",
      }));
      setResearchItems(Array.isArray(mapped) ? mapped : []);
    } catch (err) {
      setError(err?.message || String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadResearchItems();
  }, [loadResearchItems]);

  function addEmpty() {
    setResearchItems((prev) => [
      {
        name: "",
        description: "",
        img_url: "",
        previewUrl: "",
        _new: true,
      },
      ...prev,
    ]);
  }

  function updateField(idx, field, value) {
    setResearchItems((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: value };
      return copy;
    });
  }

  async function uploadImage(file, idx) {
    if (!file) return;
    setError(null);
    try {
      const path = `ResearchPhotos/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("assets")
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;

      const publicUrl = supabase.storage.from("assets").getPublicUrl(path).data
        .publicUrl;

      setResearchItems((prev) => {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], img_url: path, previewUrl: publicUrl };
        return copy;
      });
    } catch (err) {
      setError(err?.message || String(err));
    }
  }

  async function saveItem(idx) {
    const item = researchItems[idx];
    if (!item) return;

    setSaving(true);
    setError(null);
    try {
      const payload = {
        name: item.name || "",
        description: item.description || "",
        img_url: item.img_url || "",
      };

      if (item.id) payload.id = item.id;

      const { error: upsertError } = await supabase
        .from("research_information")
        .upsert(payload)
        .select();

      if (upsertError) throw upsertError;
      await loadResearchItems();
    } catch (err) {
      setError(err?.message || String(err));
    } finally {
      setSaving(false);
    }
  }

  async function deleteItem(idx) {
    const item = researchItems[idx];
    if (!item) return;

    if (!item.id) {
      setResearchItems((prev) => prev.filter((_, i) => i !== idx));
      return;
    }

    if (!confirm(`Delete research item "${item.name || "Untitled"}"?`)) return;

    setError(null);
    try {
      const { error: deleteError } = await supabase
        .from("research_information")
        .delete()
        .eq("id", item.id);
      if (deleteError) throw deleteError;

      setResearchItems((prev) => prev.filter((_, i) => i !== idx));
    } catch (err) {
      setError(err?.message || String(err));
    }
  }

  return (
    <div style={{ color: "#fff" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <h3 style={{ margin: 0 }}>Research Editor</h3>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={addEmpty}>+ New</button>
          <button onClick={loadResearchItems}>Refresh</button>
        </div>
      </div>

      {loading ? (
        <p>Loading research entries...</p>
      ) : error ? (
        <p style={{ color: "salmon" }}>{error}</p>
      ) : researchItems.length === 0 ? (
        <div style={{ padding: 12, background: "#fff", borderRadius: 8 }}>
          <p style={{ color: "#666" }}>No research entries found.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {researchItems.map((item, i) => (
            <div
              key={item.id ?? `new-${i}`}
              style={{
                border: "1px solid #e5e7eb",
                padding: 12,
                borderRadius: 8,
                background: "#fff",
                color: "#000",
              }}
            >
              <input
                value={item.name || ""}
                onChange={(e) => updateField(i, "name", e.target.value)}
                placeholder="Research title"
                style={{ width: "100%", padding: 8 }}
              />
              <textarea
                value={item.description || ""}
                onChange={(e) => updateField(i, "description", e.target.value)}
                placeholder="Research description"
                rows={5}
                style={{ width: "100%", padding: 8, marginTop: 8 }}
              />

              <div
                style={{
                  display: "flex",
                  gap: 8,
                  marginTop: 8,
                  alignItems: "center",
                  flexWrap: "wrap",
                }}
              >
                {item.previewUrl ? (
                  <img
                    src={item.previewUrl}
                    alt="research"
                    style={{
                      width: 140,
                      height: 90,
                      objectFit: "cover",
                      borderRadius: 6,
                      border: "1px solid #e5e7eb",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: 140,
                      height: 90,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "#f3f4f6",
                      color: "#666",
                      borderRadius: 6,
                    }}
                  >
                    No image
                  </div>
                )}

                <div style={{ display: "flex", flexDirection: "column" }}>
                  <label style={{ fontSize: 12, marginBottom: 4 }}>Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => uploadImage(e.target.files?.[0], i)}
                  />
                </div>

                <button
                  onClick={() => {
                    updateField(i, "img_url", "");
                    updateField(i, "previewUrl", "");
                  }}
                  style={{
                    padding: "6px 8px",
                    background: "#ef4444",
                    color: "#fff",
                    border: "none",
                    borderRadius: 6,
                  }}
                >
                  Clear
                </button>

                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    marginLeft: "auto",
                    alignItems: "center",
                  }}
                >
                  <button
                    onClick={() => saveItem(i)}
                    disabled={saving}
                    style={{ padding: "6px 10px" }}
                  >
                    {saving ? "Saving..." : "Save"}
                  </button>
                  <button
                    onClick={() => deleteItem(i)}
                    style={{
                      background: "#ef4444",
                      color: "#fff",
                      padding: "6px 10px",
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ResearchEditor;
