import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Download, Smartphone, Trash2 } from "lucide-react";
import {
  BASES,
  KIND_LABEL,
  clonePack,
  packJson,
  pullPack,
  type GamePack,
  type Kind,
} from "@/yard/packs";
import { buildTrack } from "@/yard/track";
import { deleteFork } from "@/yard/storage";

export function YardHome({
  forks,
  onStart,
}: {
  forks: GamePack[];
  onStart: (pack: GamePack) => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [raw, setRaw] = useState("");
  const [url, setUrl] = useState("");
  const [pulling, setPulling] = useState(false);
  const featured = BASES[0]!;

  async function copyPack(pack: GamePack) {
    const text = packJson(pack);
    try {
      await navigator.clipboard.writeText(text);
      setNotice(`Copied ${pack.slug}`);
      setError(null);
    } catch {
      setRaw(text);
      setNotice("Clipboard blocked. The pack is in the box below.");
    }
  }

  async function pullLink() {
    setPulling(true);
    setError(null);
    try {
      const pack = await pullPack(url);
      onStart(pack);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't pull that pack.");
    } finally {
      setPulling(false);
    }
  }

  function pullText() {
    setError(null);
    try {
      const pack = JSON.parse(raw) as unknown;
      if (!pack || typeof pack !== "object") throw new Error("That text isn't a pack.");
      onStart(clonePack(pack as GamePack));
    } catch (err) {
      setError(err instanceof Error ? err.message : "That text isn't a pack.");
    }
  }

  return (
    <main className="mx-auto min-h-dvh max-w-5xl px-4 py-6 sm:px-6 sm:py-10">
      <header className="grid gap-6 border-b border-line pb-6 sm:grid-cols-[1.1fr_0.9fr] sm:items-end">
        <div>
          <p className="font-mono text-xs tracking-widest text-sodium uppercase">Chrome · home screen</p>
          <h1 className="mt-2 font-display text-5xl font-extrabold tracking-tight text-bone sm:text-6xl">
            Yard
          </h1>
          <p className="mt-3 max-w-xl text-base text-mist">
            Pull a full 3D game, drive it, then fork the grip, the clock, and the body into your own pack.
            Packs are the repo. The race is already built.
          </p>
        </div>
        <p className="flex items-start gap-3 text-sm text-mist">
          <Smartphone className="mt-0.5 size-5 shrink-0 text-sodium" aria-hidden="true" />
          In Chrome, use the browser menu and install Yard. It opens fullscreen from your home screen, phone or desktop.
        </p>
      </header>

      <section className="mt-6 border border-line bg-panel p-4 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-mono text-xs text-sodium">{featured.slug}</p>
            <h2 className="mt-1 font-display text-3xl font-extrabold">{featured.title}</h2>
            <p className="mt-2 max-w-lg text-sm text-mist">{featured.summary}</p>
          </div>
          <TrackGlyph kind={featured.kind} />
        </div>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            className="btn btn-primary sm:min-w-40"
            data-yard-start="night-circuit"
            onClick={() => onStart(featured)}
          >
            Start
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => copyPack(featured)}>
            <Download className="size-4" aria-hidden="true" />
            Copy pack
          </button>
        </div>
        <p className="mt-3 font-mono text-xs text-mist">3 laps · drift boost · rivals on the grid · touch or keys</p>
      </section>

      <section className="mt-6 border border-line bg-panel p-4 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-mono text-xs text-sodium">mecha-bay</p>
            <h2 className="mt-1 font-display text-3xl font-extrabold">Mecha Bay</h2>
            <p className="mt-2 max-w-lg text-sm text-mist">
              Build your biomech. Bolt parts onto seven slots in Racer or Combat mode,
              watch the stats move, then transform it mid-preview.
            </p>
          </div>
        </div>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <Link to="/mecha" className="btn btn-primary sm:min-w-40">
            Open Mecha Bay
          </Link>
        </div>
        <p className="mt-3 font-mono text-xs text-mist">
          7 slots × racer/combat modes · live 3D preview · transforms on command
        </p>
      </section>

      <section className="mt-8">
        <h2 className="font-mono text-xs tracking-widest text-mist uppercase">Bases</h2>
        <ul className="mt-2 divide-y divide-line border-y border-line">
          {BASES.map((pack) => (
            <li key={pack.slug} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1">
                <p className="font-mono text-xs text-sodium">{pack.slug}</p>
                <p className="font-display text-xl font-bold">{pack.title}</p>
                <p className="text-sm text-mist">
                  {KIND_LABEL[pack.kind]} · {pack.summary}
                </p>
              </div>
              <div className="flex gap-2">
                <button type="button" className="btn btn-ghost" onClick={() => onStart(pack)}>
                  Pull
                </button>
                <button type="button" className="btn btn-ghost" onClick={() => copyPack(pack)} aria-label={`Copy ${pack.title} pack`}>
                  <Download className="size-4" aria-hidden="true" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="font-mono text-xs tracking-widest text-mist uppercase">On this phone</h2>
        {forks.length === 0 ? (
          <p className="mt-3 text-sm text-mist">No forks yet. Start a base, open Fork, and save.</p>
        ) : (
          <ul className="mt-2 divide-y divide-line border-y border-line">
            {forks.map((pack) => (
              <li key={pack.slug} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-xs text-sodium">{pack.slug}</p>
                  <p className="font-display text-lg font-bold">{pack.title}</p>
                  <p className="text-sm text-mist">
                    {pack.forkedFrom ? `from ${pack.forkedFrom}` : KIND_LABEL[pack.kind]}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button type="button" className="btn btn-ghost" onClick={() => onStart(pack)}>
                    Pull
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    aria-label={`Delete ${pack.title}`}
                    onClick={() => deleteFork(pack.slug)}
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <details className="mt-8 border border-line bg-panel-2 p-4">
        <summary className="cursor-pointer font-display text-lg font-bold">Pull a pack</summary>
        <p className="mt-2 text-sm text-mist">
          A pack is the whole game as JSON: base, handling, paint. Paste one, or give an https link to a raw .json file.
          Arbitrary game repos do not boot in a phone browser. This format does.
        </p>
        <label className="mt-4 block text-sm text-mist" htmlFor="pack-url">
          Pack link
        </label>
        <div className="mt-1 flex flex-col gap-2 sm:flex-row">
          <input
            id="pack-url"
            className="field"
            value={url}
            placeholder="https://…/my-game.json"
            onChange={(e) => setUrl(e.target.value)}
            inputMode="url"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
          />
          <button type="button" className="btn btn-primary" disabled={pulling || !url.trim()} onClick={pullLink}>
            {pulling ? "Pulling" : "Pull link"}
          </button>
        </div>
        <label className="mt-4 block text-sm text-mist" htmlFor="pack-json">
          Pack JSON
        </label>
        <textarea
          id="pack-json"
          className="field mt-1 min-h-36"
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          spellCheck={false}
          placeholder='{"format":"yard-pack","version":1,…}'
        />
        <button type="button" className="btn btn-ghost mt-2" disabled={!raw.trim()} onClick={pullText}>
          Pull JSON
        </button>
      </details>

      {error ? (
        <p className="mt-4 text-sm text-sodium" role="alert">
          {error}
        </p>
      ) : null}
      {notice ? <p className="mt-4 text-sm text-mist">{notice}</p> : null}
    </main>
  );
}

function TrackGlyph({ kind }: { kind: Kind }) {
  const d = useMemo(() => glyphPath(kind), [kind]);
  return (
    <svg viewBox="0 0 160 96" className="h-24 w-40 shrink-0 text-sodium" aria-hidden="true">
      <rect width="160" height="96" className="fill-ink" />
      <path d={d} fill="none" stroke="currentColor" strokeWidth="3" />
    </svg>
  );
}

function glyphPath(kind: Kind) {
  const track = buildTrack(kind);
  if (kind === "sweep") return "M80 18 a30 30 0 1 0 0.1 0";
  const pts = track.samples;
  let minX = Infinity;
  let minZ = Infinity;
  let maxX = -Infinity;
  let maxZ = -Infinity;
  for (const p of pts) {
    minX = Math.min(minX, p.x);
    minZ = Math.min(minZ, p.z);
    maxX = Math.max(maxX, p.x);
    maxZ = Math.max(maxZ, p.z);
  }
  const span = Math.max(maxX - minX, maxZ - minZ) || 1;
  const map = pts.map((p) => {
    const x = ((p.x - minX) / span) * 136 + 12;
    const y = ((p.z - minZ) / span) * 72 + 12;
    return `${x.toFixed(1)} ${y.toFixed(1)}`;
  });
  return `M${map.join(" L")}${track.closed ? " Z" : ""}`;
}
