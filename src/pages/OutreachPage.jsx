import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import './OutreachPage.css';

// Use env vars where available but fall back to the existing project keys if not set
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

function formatDate(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString();
  } catch {
    return iso;
  }
}

const headingfont = {
  fontFamily: 'Space Mono, Poppins, sans-serif',
  fontWeight: 800,
};

const contentFont = {
  fontFamily: 'Roboto Mono, Ubuntu, monospace',
  fontWeight: 200,
};

const subHeadingFont = {
  fontFamily: 'Poppins, "Segoe UI", sans-serif',
  fontWeight: 800,
};

const subContentFont = {
  fontFamily: 'Ubuntu, Roboto, sans-serif',
  fontWeight: 200,
};

export default function OutreachPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        // load rows
        const { data, error } = await supabase
          .from('outreach')
          .select('*')
          .order('created_at', { ascending: false });
        if (error) {
          console.error('Supabase load error', error);
          setItems([]);
          setLoading(false);
          return;
        }

        // resolve storage photos to public URLs when they look like storage paths
        const resolved = await Promise.all((data || []).map(async (row) => {
          const out = { ...row };
          if (out.photo && out.photo.startsWith && out.photo.indexOf('http') !== 0) {
            try {
              const { data: urlData } = supabase.storage
                .from('assets')
                .getPublicUrl(out.photo);
              if (urlData && urlData.publicUrl) out.photo = urlData.publicUrl;
            } catch {
              // leave as-is on error
            }
          }
          return out;
        }));

        if (mounted) setItems(resolved);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  function isNew(iso) {
    try {
      const d = new Date(iso);
      const diff = Date.now() - d.getTime();
      const days = diff / (1000 * 60 * 60 * 24);
      return days < 7;
    } catch {
      return false;
    }
  }

  return (
    <div className="outreach-page container">
      <div className="outreach-header-top">
        <h2 className="page-title" style={headingfont}>Outreach</h2>
      </div>
      {loading && <p>Loading...</p>}
      {!loading && items.length === 0 && <p>No outreach items found.</p>}
      <div className="outreach-rows">
        {items.map((it) => (
          <div className="outreach-row" key={it.id}>
            <div className="outreach-left">
              {it.photo ? (
                <img src={it.photo} alt={it.title || 'Outreach image'} className="outreach-image" />
              ) : (
                <div className="outreach-image placeholder" />
              )}
            </div>
            <div className="outreach-right">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                <h3 className="outreach-title" id={`outreach-title-${it.id}`} style={subHeadingFont}>{it.title}</h3>
                {isNew(it.created_at) && <span className="new-badge">NEW</span>}
              </div>
              <div className="outreach-meta" style={subContentFont}>{formatDate(it.created_at)}</div>
              <p className="outreach-content" style={contentFont}>{it.content}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
