"use client";

interface ChatHeaderProps {
  pillar: string;
  industry: string;
  onPillarChange: (pillar: string) => void;
  onIndustryChange: (industry: string) => void;
}

export default function ChatHeader({
  pillar,
  industry,
  onPillarChange,
  onIndustryChange,
}: ChatHeaderProps) {
  return (
    <header className="sticky top-0 z-10 border-b border-neutral-200 bg-white">
      <div className="mx-auto max-w-4xl px-4 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold text-neutral-900">
            Aztec IET Assistant
          </h1>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <label
                htmlFor="pillar"
                className="text-sm font-medium text-neutral-700"
              >
                Pillar:
              </label>
              <select
                id="pillar"
                value={pillar}
                onChange={(e) => onPillarChange(e.target.value)}
                className="rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm text-neutral-900 focus-ring"
              >
                <option value="academic">Academic</option>
                <option value="soft">Soft Skills</option>
                <option value="cte">CTE</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label
                htmlFor="industry"
                className="text-sm font-medium text-neutral-700"
              >
                Industry:
              </label>
              <select
                id="industry"
                value={industry}
                onChange={(e) => onIndustryChange(e.target.value)}
                className="rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm text-neutral-900 focus-ring"
              >
                <option value="healthcare">Healthcare</option>
                <option value="hospitality">Hospitality</option>
                <option value="construction">Construction</option>
                <option value="retail">Retail</option>
                <option value="manufacturing">Manufacturing</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
