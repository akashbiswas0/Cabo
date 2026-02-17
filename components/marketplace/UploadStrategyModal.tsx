"use client";
import { useState } from "react";
import { X, Upload, Loader2, CheckCircle2, ExternalLink } from "lucide-react";
import type { UploadFormState } from "./types";

type Props = {
  onClose: () => void;
  /** NEAR account of the user creating the listing (for "My Listings"). */
  listerAccountId?: string | null;
};

type UploadSuccess = {
  groupId?: string;
  cid?: string;
  trans_id: string;
  message: string;
  price?: string;
};

const initialForm: UploadFormState = {
  name: "",
  description: "",
  price: "",
  priceType: "one-time",
  file: null,
};

const EXPLORER_TX_URL = "https://nearblocks.io/txns";

export default function UploadStrategyModal({ onClose, listerAccountId }: Props) {
  const [form, setForm] = useState<UploadFormState>(initialForm);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState<UploadSuccess | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.file) {
      setError("Please select a strategy file.");
      return;
    }
    setError(null);
    setUploading(true);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120_000); // 2 min — NOVA can be slow
    try {
      const fd = new FormData();
      fd.set("name", form.name);
      fd.set("description", form.description);
      fd.set("price", form.price);
      fd.set("priceType", form.priceType);
      fd.set("file", form.file);
      if (listerAccountId) fd.set("listerAccountId", listerAccountId);
      const res = await fetch("/api/marketplace/upload-strategy", {
        method: "POST",
        body: fd,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      const data = await res.json();
      if (!res.ok) {
        setError(data.detail || data.error || "Upload failed");
        return;
      }
      setSuccess({
        groupId: data.groupId,
        cid: data.cid,
        trans_id: data.trans_id,
        message: data.message || "Strategy uploaded securely to NOVA.",
        price: data.price,
      });
    } catch (err) {
      clearTimeout(timeoutId);
      if (err instanceof Error && err.name === "AbortError") {
        setError("Request took too long. Your transaction may have succeeded — check NEAR Explorer.");
      } else {
        setError(err instanceof Error ? err.message : "Upload failed");
      }
    } finally {
      setUploading(false);
    }
  };

  if (success) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
        onClick={onClose}
      >
        <div
          className="rounded-2xl border border-white/10 bg-background p-6 max-w-lg w-full shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-400 flex-shrink-0" aria-hidden />
            <h2 className="text-xl font-semibold text-white">Strategy listed with NOVA</h2>
          </div>
          <p className="text-sm text-gray-400 font-serif italic mb-4">{success.message}</p>
          <dl className="space-y-2 text-sm mb-4">
            {success.groupId != null && success.groupId !== "" && (
              <div>
                <dt className="text-gray-500">Group</dt>
                <dd className="font-mono text-white break-all">{success.groupId}</dd>
              </div>
            )}
            {success.cid != null && success.cid !== "" && (
              <div>
                <dt className="text-gray-500">IPFS CID</dt>
                <dd className="font-mono text-white break-all">{success.cid}</dd>
              </div>
            )}
            {success.price != null && success.price !== "" && (
              <div>
                <dt className="text-gray-500">Price (set by you)</dt>
                <dd className="text-white font-medium">{success.price}</dd>
              </div>
            )}
            <div>
              <dt className="text-gray-500">Transaction</dt>
              <dd>
                <a
                  href={`${EXPLORER_TX_URL}/${success.trans_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white underline hover:no-underline inline-flex items-center gap-1"
                >
                  {success.trans_id.length > 12 ? `${success.trans_id.slice(0, 12)}…` : success.trans_id}
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </dd>
            </div>
          </dl>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 rounded-xl font-semibold text-white border border-white/20 bg-white/10 hover:bg-white hover:text-black transition-all"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
      onClick={onClose}
    >
      <div
        className="rounded-2xl border border-white/10 bg-background p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">List New Strategy</h2>
          <button
            onClick={onClose}
            disabled={uploading}
            className="p-2 rounded-lg hover:bg-white/10 text-gray-400 disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <form className="space-y-4" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm text-gray-400 mb-1">Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Strategy name"
              required
              disabled={uploading}
              className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white placeholder-gray-500 outline-none focus:border-white/20 disabled:opacity-60"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Short description (no spoilers)</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Teaser only — no entry logic or spoilers"
              rows={3}
              disabled={uploading}
              className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white placeholder-gray-500 outline-none focus:border-white/20 resize-none disabled:opacity-60"
            />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-sm text-gray-400 mb-1">Price (NEAR)</label>
              <input
                type="text"
                value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                placeholder="e.g. 25"
                disabled={uploading}
                className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white placeholder-gray-500 outline-none focus:border-white/20 disabled:opacity-60"
              />
            </div>
            <div className="w-36">
              <label className="block text-sm text-gray-400 mb-1">Type</label>
              <select
                value={form.priceType}
                onChange={(e) =>
                  setForm((f) => ({ ...f, priceType: e.target.value as "one-time" | "subscription" }))
                }
                disabled={uploading}
                className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white outline-none focus:border-white/20 disabled:opacity-60"
              >
                <option value="one-time">One-time</option>
                <option value="subscription">Subscription</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Strategy file (encrypted via NOVA)</label>
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl border border-white/10 bg-white/5 border-dashed">
              <Upload className="w-5 h-5 text-gray-500 flex-shrink-0" aria-hidden />
              <input
                type="file"
                accept=".json,.enc,.bin,application/octet-stream,application/json"
                onChange={(e) =>
                  setForm((f) => ({ ...f, file: e.target.files?.[0] ?? null }))
                }
                required
                disabled={uploading}
                className="text-sm text-gray-400 file:mr-2 file:py-1 file:px-3 file:rounded file:border-0 file:bg-white/10 file:text-white disabled:opacity-60"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={uploading}
            className="w-full py-3 rounded-xl font-semibold text-white border border-white/20 bg-white/10 hover:bg-white hover:text-black transition-all disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {uploading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" aria-hidden />
                Uploading to NOVA…
              </>
            ) : (
              "List strategy"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
