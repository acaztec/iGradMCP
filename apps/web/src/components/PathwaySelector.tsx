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
    <section className="relative overflow-hidden rounded-3xl bg-[#0f4c81] p-6 text-white shadow-lg ring-1 ring-[#174d8a] sm:p-8">
      <div className="absolute inset-x-0 -top-28 flex justify-center opacity-30 blur-3xl">
        <div className="h-40 w-40 rounded-full bg-gradient-to-br from-[#1d5ca2] via-[#174d8a] to-[#0b3d6f]" />
      </div>
      <div className="relative flex flex-col gap-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-2xl text-[#0b3d6f]">
              🎓
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-white">
                Hi! I&rsquo;m Aztec IET, your AI assistant.
              </h1>
              <p className="mt-1 text-sm text-[#dbe5f5]">
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
            const labelColor = isSelected ? "text-white" : "text-[#0b3d6f]";
            const descriptionColor = isSelected
              ? "text-white/90"
              : "text-[#28588f]";

            return (
              <button
                key={option.id}
                type="button"
                disabled={isBusy}
                onClick={() => onSelect(option)}
                className={`group rounded-2xl border-2 px-5 py-4 text-left transition focus-ring ${
                  isSelected
                    ? "border-[#f47b20] bg-[#f47b20] text-white shadow-lg"
                    : "border-transparent bg-white text-[#0b3d6f] shadow-sm hover:border-[#f47b20]/60 hover:shadow-md"
                } ${isBusy ? "cursor-not-allowed opacity-60" : ""}`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-base font-semibold ${labelColor}`}>
                    {option.label}
                  </span>
                  {comingSoon && (
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        isSelected
                          ? "bg-white/20 text-white"
                          : "bg-[#1d5ca2] text-white"
                      }`}
                    >
                      Coming soon
                    </span>
                  )}
                </div>
                <p className={`mt-2 text-sm ${descriptionColor}`}>
                  {option.description}
                </p>
                {isSelected && !comingSoon && (
                  <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-white/80">
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
