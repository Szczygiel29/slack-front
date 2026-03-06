import Link from "next/link";
import { notFound } from "next/navigation";

import { blogPosts, getPostBySlug } from "../posts";

type ArticlePageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }));
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-white/10 bg-slate-950/80">
        <nav className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-indigo-500/90 text-sm font-semibold shadow-lg shadow-indigo-500/40">
              S
            </div>
            <span className="text-lg font-semibold tracking-tight">
              Slackmate
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/blog"
              className="text-sm font-medium text-white/70 transition hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400">
              Back to Blog
            </Link>
            <Link
              href="/offers"
              className="rounded-full bg-indigo-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-300">
              Buy Now
            </Link>
          </div>
        </nav>
      </header>

      <main className="mx-auto w-full max-w-4xl px-6 py-14">
        <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-indigo-500/15 via-white/5 to-transparent p-8">
          <div className="absolute -right-24 -top-24 h-48 w-48 rounded-full bg-indigo-400/15 blur-3xl" />
          <p className="relative text-xs font-semibold uppercase tracking-wide text-indigo-200">
            {post.category}
          </p>
          <h1 className="relative mt-3 text-3xl font-semibold leading-tight text-white md:text-4xl">
            {post.title}
          </h1>
          <p className="relative mt-4 text-sm text-white/70">
            {post.publishedAt} · {post.readTime}
          </p>
        </section>

        <article className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-8">
          <p className="text-sm leading-7 text-white/80">{post.description}</p>

          {post.sections.map((section) => (
            <div key={section.heading}>
              <h2 className="mt-8 text-2xl font-semibold text-white">
                {section.heading}
              </h2>
              <p className="mt-3 text-sm leading-7 text-white/75">
                {section.content}
              </p>
            </div>
          ))}

          <div className="mt-8 rounded-2xl border border-indigo-300/30 bg-indigo-500/10 p-4 text-sm text-indigo-100">
            {post.highlight}
          </div>

          <div className="mt-8">
            <Link
              href="/blog"
              className="inline-flex items-center justify-center rounded-full border border-white/20 px-4 py-2 text-sm font-medium text-white/80 transition hover:border-white/40 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400">
              Back to article list
            </Link>
          </div>
        </article>
      </main>
    </div>
  );
}
