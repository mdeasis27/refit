import { ImageResponse } from "next/og";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLocale } from "@/lib/i18n/locales";

export const alt = "Refit";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const t = getDictionary(isLocale(lang) ? lang : "en");
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "72px 88px",
        background: "#f7f3ea",
        color: "#1c1b19",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", alignSelf: "flex-start" }}>
        <div style={{ fontSize: 168, fontWeight: 800, letterSpacing: -6, lineHeight: 1 }}>
          refit
        </div>
        <div
          style={{ display: "flex", height: 12, marginTop: 8, borderTop: "12px dashed #a6361c" }}
        />
      </div>
      <div style={{ fontSize: 52, marginTop: 48, lineHeight: 1.25, maxWidth: 980 }}>
        {t.meta.ogTagline}
      </div>
    </div>,
    size,
  );
}
