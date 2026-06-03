import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://autowasdag.sionkerk.nl";
  return [
    { url: base,                  lastModified: new Date(), changeFrequency: "weekly",  priority: 1    },
    { url: `${base}/reserveren`,  lastModified: new Date(), changeFrequency: "monthly", priority: 0.9  },
    { url: `${base}/help-mee`,    lastModified: new Date(), changeFrequency: "monthly", priority: 0.8  },
  ];
}
