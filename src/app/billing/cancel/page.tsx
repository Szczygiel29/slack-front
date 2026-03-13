import Link from "next/link";

export default function BillingCancelPage() {
  return (
    <div className="min-h-screen bg-slate-950 px-6 py-16 text-white">
      <div className="mx-auto max-w-2xl rounded-3xl border border-rose-400/30 bg-rose-500/10 p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-200">
          Payment not completed
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-white">
          Your checkout was cancelled or did not finish successfully.
        </h1>
        <p className="mt-4 text-sm text-white/75">
          Return to the admin panel to review your subscription and try again
          when you are ready.
        </p>
        <div className="mt-8">
          <Link
            href="/admin"
            className="inline-flex items-center justify-center rounded-full bg-rose-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-rose-500/30 transition hover:bg-rose-400">
            Back to admin
          </Link>
        </div>
      </div>
    </div>
  );
}
