import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? "https://autowasdagsionkerk.nl";
  return [
    { url: base,                  lastModified: new Date(), changeFrequency: "weekly",  priority: 1   },
    { url: `${base}/reserveren`,  lastModified: new Date(), changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/help-mee`,    lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/bijdragen`,   lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
  ];
}
