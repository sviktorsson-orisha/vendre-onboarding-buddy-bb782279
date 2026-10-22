import { useEffect, useState } from "react";


import { Slider } from "@/components/ui/slider";
import { useI18n } from "@/lib/i18n";
import type { CategoryFilter } from "@/types/vendre";

/** Spec filters (type 4) carry no ids — their options are identified by name. */
export function isSpecFilter(filter: CategoryFilter) {
  return String(filter.type) === "4";
}

/**
 * Renders only what the store returns in `filters`.
 * Tag filters (type 1) are sent as tags[], spec filters (type 4) as f[{id}][].
 * Category filters (type 0) are rendered as subcategory links elsewhere.
 */
function isPriceFilter(filter: CategoryFilter) {
  return String(filter.type) === "2";
}

/** Price range (type 2) — dual-handle slider, sent to the store as pfrom/pto. */
function PriceFilter({
  filter,
  from,
  to,
  onApply,
}: {
  filter: CategoryFilter;
  from?: number | undefined;
  to?: number | undefined;
  onApply: (from?: number, to?: number) => void;
}) {
  const { t } = useI18n();
  const min = Math.floor(filter.min ?? 0);
  const max = Math.ceil(filter.max ?? 0);
  const [range, setRange] = useState<[number, number]>([from ?? min, to ?? max]);

  useEffect(() => {
    setRange([from ?? min, to ?? max]);
  }, [from, to, min, max]);

  const commit = (value: number[]) => {
    const low = value[0] ?? min;
    const high = value[1] ?? max;
    onApply(low > min ? low : undefined, high < max ? high : undefined);
  };

  if (max <= min) return null;

  return (
    <fieldset className="space-y-3">
      <legend className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {filter.name}
      </legend>
      <Slider
        min={min}
        max={max}
        step={1}
        value={range}
        minStepsBetweenThumbs={1}
        onValueChange={(value) => setRange([value[0] ?? min, value[1] ?? max])}
        onValueCommit={commit}
        aria-label={filter.name}
      />
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {t("store.priceFrom")} {range[0]}
        </span>
        <span>
          {t("store.priceTo")} {range[1]}
        </span>
      </div>
    </fieldset>
  );
}


export type FilterProps = {
  filters: CategoryFilter[];
  selected: string[];
  selectedSpecs: Record<string, string[]>;
  priceFrom?: number | undefined;
  priceTo?: number | undefined;
  onToggleTag: (id: string) => void;
  onToggleSpec: (filterId: string, value: string) => void;
  onPriceChange: (from?: number, to?: number) => void;
  onClear: () => void;
};

/** Only filters the store actually returns with usable values. */
export function visibleFilters(filters: CategoryFilter[]) {
  return (filters ?? []).filter(
    (filter) =>
      String(filter.type) !== "0" &&
      (isPriceFilter(filter)
        ? filter.min != null && filter.max != null
        : (filter.options ?? []).length > 0),
  );
}

export function activeFilterCount({
  selected,
  selectedSpecs,
  priceFrom,
  priceTo,
}: Pick<FilterProps, "selected" | "selectedSpecs" | "priceFrom" | "priceTo">) {
  return (
    selected.length +
    Object.values(selectedSpecs).reduce((sum, values) => sum + values.length, 0) +
    (priceFrom != null || priceTo != null ? 1 : 0)
  );
}

/** The filter controls themselves — reused by the sidebar and the mobile panel. */
export function FiltersContent({
  filters,
  selected,
  selectedSpecs,
  priceFrom,
  priceTo,
  onToggleTag,
  onToggleSpec,
  onPriceChange,
  onClear,
  showHeading = true,
}: FilterProps & { showHeading?: boolean }) {
  const { t } = useI18n();
  const visible = visibleFilters(filters);
  if (visible.length === 0) return null;

  const active = activeFilterCount({ selected, selectedSpecs, priceFrom, priceTo }) > 0;

  return (
    <div className="space-y-6">
      {(showHeading || active) && (
        <div className="flex items-center justify-between">
          {showHeading ? (
            <h2 className="text-sm font-semibold text-foreground">{t("store.filters")}</h2>
          ) : (
            <span />
          )}
          {active && (
            <button type="button" className="text-xs text-foreground underline" onClick={onClear}>
              {t("store.clearFilters")}
            </button>
          )}
        </div>
      )}

      {visible.map((filter) => {
        if (isPriceFilter(filter))
          return (
            <PriceFilter
              key={String(filter.id)}
              filter={filter}
              from={priceFrom}
              to={priceTo}
              onApply={onPriceChange}
            />
          );
        const spec = isSpecFilter(filter);
        const filterId = String(filter.id);
        const chosen = spec ? (selectedSpecs[filterId] ?? []) : selected;
        return (
          <fieldset key={filterId} className="space-y-2">
            <legend className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {filter.name}
            </legend>
            {(filter.options ?? []).map((option) => {
              const value = spec ? option.name : String(option.id);
              return (
                <label
                  key={`${filterId}-${value}`}
                  className="flex items-center gap-2 text-sm text-foreground"
                >
                  <input
                    type="checkbox"
                    className="size-4 rounded border-border"
                    checked={chosen.includes(value)}
                    onChange={() => (spec ? onToggleSpec(filterId, value) : onToggleTag(value))}
                  />
                  <span className="grow">{option.name}</span>
                  {option.count != null && (
                    <span className="text-xs text-muted-foreground">{option.count}</span>
                  )}
                </label>
              );
            })}
          </fieldset>
        );
      })}
    </div>
  );
}

/** Desktop sidebar. Mobile uses CategoryMobileControls instead. */
export function CategoryFilters(props: FilterProps) {
  if (visibleFilters(props.filters).length === 0) return null;
  return (
    <aside className="hidden lg:block lg:w-60 lg:shrink-0">
      <FiltersContent {...props} />
    </aside>
  );
}
