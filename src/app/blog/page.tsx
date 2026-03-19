import Link from "next/link";
import { blogPosts } from "./posts";

export default function BlogPage() {
  const featuredPost = blogPosts[0];
  const allPosts = blogPosts;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-white/10 bg-slate-950/80">
        <nav className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-indigo-500/90 text-sm font-semibold shadow-lg shadow-indigo-500/40">
              S
            </div>
            <span className="text-lg font-semibold tracking-tight">
              ThreadoAI
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-sm font-medium text-white/70 transition hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400">
              Home
            </Link>
            <Link
              href="/auth"
              className="rounded-full bg-indigo-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-300">
              Sign in / Create account
            </Link>
          </div>
        </nav>
      </header>

      <main className="mx-auto w-full max-w-6xl px-6 py-14">
        <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-indigo-500/15 via-white/5 to-transparent p-8">
          <div className="absolute -right-24 -top-24 h-48 w-48 rounded-full bg-indigo-400/15 blur-3xl" />
          <p className="relative text-xs font-semibold uppercase tracking-wide text-indigo-200">
            Blog
          </p>
          <h1 className="relative mt-3 max-w-3xl text-3xl font-semibold leading-tight text-white md:text-4xl">
            {featuredPost.title}
          </h1>
          <p className="relative mt-4 text-sm text-white/70">
            {featuredPost.publishedAt} · {featuredPost.readTime} ·{" "}
            {featuredPost.category}
          </p>
          <div className="relative mt-6 flex flex-wrap items-center gap-3">
            <Link
              href="/"
              className="rounded-full border border-white/20 px-4 py-2 text-sm font-medium text-white/80 transition hover:border-white/40 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400">
              Back to Home
            </Link>
            <Link
              href="/offers"
              className="rounded-full bg-indigo-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-300">
              Buy Now
            </Link>
          </div>
        </section>

        <article className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-8">
          <p className="text-sm leading-7 text-white/80">
            {featuredPost.description}
          </p>

          {featuredPost.sections.map((section) => (
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
            {featuredPost.highlight}
          </div>
          <div className="mt-6">
            <Link
              href={`/blog/${featuredPost.slug}`}
              className="text-sm font-semibold text-indigo-200 transition hover:text-indigo-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-300">
              Read full article
            </Link>
          </div>
        </article>

        <section className="mt-10">
          <h2 className="text-xl font-semibold text-white">All articles</h2>
          <div className="mt-4 space-y-4">
            {allPosts.map((post) => (
              <Link
                key={`all-${post.slug}`}
                href={`/blog/${post.slug}`}
                className="block rounded-2xl border border-white/10 bg-white/5 p-5 transition hover:border-indigo-300/40 hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-300">
                <p className="text-xs font-medium uppercase tracking-wide text-indigo-200">
                  {post.category}
                </p>
                <h3 className="mt-2 text-lg font-semibold text-white">
                  {post.title}
                </h3>
                <p className="mt-2 text-sm text-white/70">{post.description}</p>
                <p className="mt-3 text-xs text-white/50">
                  {post.publishedAt} · {post.readTime}
                </p>
              </Link>
            ))}
          </div>
        </section>

      </main>
    </div>
  );
}
