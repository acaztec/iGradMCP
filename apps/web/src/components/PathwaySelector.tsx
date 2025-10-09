"use client";

interface PathwayOption {
  id: string;
  label: string;
  description: string;
  status: "available" | "coming-soon";
}

interface PathwaySelectorProps {
  options: PathwayOption[];
  selectedPathway: string | null;
  isBusy: boolean;
  onSelect: (option: PathwayOption) => void;
}

export default function PathwaySelector({
  options,
  selectedPathway,
  isBusy,
  onSelect,
}: PathwaySelectorProps) {
  return (
    <section className="relative overflow-hidden rounded-3xl bg-white p-6 shadow-sm ring-1 ring-purple-100 sm:p-8">
      <div className="absolute inset-x-0 -top-28 flex justify-center opacity-10 blur-3xl">
        <div className="h-40 w-40 rounded-full bg-gradient-to-br from-purple-400 via-purple-500 to-purple-700" />
      </div>
      <div className="relative flex flex-col gap-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-100 text-2xl text-purple-600">
              🎓
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-purple-900">
                Hi! I&rsquo;m Elevatia, your AI assistant.
              </h1>
              <p className="mt-1 text-sm text-purple-700">
                I&rsquo;m here to guide you through Integrated Education &amp; Training pathways.
                Choose a certification focus below to get tailored next steps.
              </p>
            </div>
          </div>
        </header>
        <div className="grid gap-3 sm:grid-cols-2">
          {options.map((option) => {
            const isSelected = selectedPathway === option.id;
            const comingSoon = option.status === "coming-soon";

            return (
              <button
                key={option.id}
                type="button"
                disabled={isBusy}
                onClick={() => onSelect(option)}
                className={`group rounded-2xl border px-5 py-4 text-left transition focus-ring ${
                  isSelected
                    ? "border-purple-500 bg-purple-50/60 shadow-md"
                    : "border-purple-200 bg-white shadow-sm hover:border-purple-400 hover:shadow"
                } ${isBusy ? "cursor-not-allowed opacity-60" : ""}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-base font-semibold text-purple-900">
                    {option.label}
                  </span>
                  {comingSoon && (
                    <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-600">
                      Coming soon
                    </span>
                  )}
                </div>
                <p className="mt-2 text-sm text-purple-700">
                  {option.description}
                </p>
                {isSelected && !comingSoon && (
                  <p className="mt-3 text-xs font-medium uppercase tracking-wide text-purple-600">
                    Selected pathway
                  </p>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
