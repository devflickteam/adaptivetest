
export const MOCK_REPORT = {
  summary: { issues: 3, total_pages: 2 },
  pages: [
    {
      url: "https://example.com",
      issues: [
        { type: "img-missing-alt", src: "/hero.jpg" },
        { type: "low-contrast-text", src: "h1.hero-title" }
      ],
      data: {
        images: [
          { src: "https://example.com/hero.jpg", alt: "", contrast: { contrast_vs_white: 1.5, contrast_vs_black: 12.4 } },
          { src: "https://example.com/logo.svg", alt: "Example Logo", contrast: { contrast_vs_white: 5.1, contrast_vs_black: 8.2 } }
        ],
        broken_links: [
          { href: "https://bad.example.com", status: 404 }
        ]
      },
      gpt: "This page has missing alt attributes on decorative images and a potential low contrast heading over a background image."
    },
    {
      url: "https://example.com/contact",
      issues: [],
      data: {
        images: [],
        broken_links: []
      },
      gpt: ""
    }
  ]
};
