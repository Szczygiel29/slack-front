import Link from "next/link";

export default function BillingSuccessPage() {
  return (
    <div className="min-h-screen bg-slate-950 px-6 py-16 text-white">
      <div className="mx-auto max-w-2xl rounded-3xl border border-emerald-400/30 bg-emerald-500/10 p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200">
          Payment successful
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-white">
          Your checkout was completed successfully.
        </h1>
        <p className="mt-4 text-sm text-white/75">
          You can now return to the admin panel and continue managing your
          account.
        </p>
        <div className="mt-8">
          <Link
            href="/admin"
            className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-400">
            Back to admin
          </Link>
        </div>
      </div>
    </div>
  );
}
