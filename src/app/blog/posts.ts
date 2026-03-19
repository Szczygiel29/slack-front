export type BlogPost = {
  slug: string;
  title: string;
  description: string;
  readTime: string;
  category: string;
  publishedAt: string;
  sections: {
    heading: string;
    content: string;
  }[];
  highlight: string;
};

export const blogPosts: BlogPost[] = [
  {
    slug: "threadoai-launch",
    title: "ThreadoAI is live: one app for digest, follow-up, and thread actions",
    description:
      "ThreadoAI is now available for teams that want better thread execution in Slack without adding extra tools.",
    readTime: "5 min read",
    category: "Product Launch",
    publishedAt: "March 6, 2026",
    sections: [
      {
        heading: "What ThreadoAI does",
        content:
          "ThreadoAI helps teams run thread workflows from signal to action: digest, follow-up reminders, task extraction, summaries, translations, and approved replies.",
      },
      {
        heading: "Core features available now",
        content:
          "Automatic Digest on schedule, Follow-up Tracker with SLA reminders, Action Items Extractor, Manual Digest in DM, Reply Suggestions with manual approval, Thread Summary, Translate In Place, and Decision Log in Home.",
      },
      {
        heading: "Why this launch matters",
        content:
          "Most teams lose context across busy threads. ThreadoAI reduces missed responses, makes ownership clearer, and keeps team decisions visible for future work.",
      },
    ],
    highlight:
      "ThreadoAI launch focus: automate routine thread operations while keeping final messaging and ownership under team control.",
  },
];

export const getPostBySlug = (slug: string) =>
  blogPosts.find((post) => post.slug === slug);
