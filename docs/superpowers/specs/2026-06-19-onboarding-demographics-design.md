# Onboarding & Profile Demographics — Design

**Date:** 2026-06-19
**Status:** Approved (pending spec review)

## Goal

Collect three demographic fields from users — **age range**, **country**, and **state/province** — during onboarding, and let them edit those fields later on the profile page. Today onboarding only collects name + avatar.

## Decisions (from brainstorming)

- **Location depth:** Country + State/Province. No city (no reliable city dataset; out of scope).
- **UI:** Render with the app's own shadcn components (matches the dark/orange theme), backed by the `country-region-data` package — not the raw native `<select>`s of `react-country-region-selector`.
- **Age buckets (includes minors):** `13-17, 18-24, 25-34, 35-44, 45-54, 55-64, 65+`.
- **Scope:** Onboarding wizard **and** the profile edit page.
- **Required:** During onboarding — name, age, country required; region required **only when the selected country has regions**. On the profile edit page all three are optional.

## Dependency

Add `country-region-data` (MIT) via yarn. This is the data package that `react-country-region-selector` wraps internally. Shape:

```ts
{ countryName: string; countryShortCode: string; regions: { name: string; shortCode: string }[] }[]
```

**Integration note:** `country-region-data` v3 ships ESM with subpath exports. The implementation must verify the correct import in this Next.js setup (likely `import countryRegions from "country-region-data/dist/data-umd"` or the named `allCountries` export) and confirm it builds, before wiring it into components.

## Data model

Add three optional columns to `User` in `prisma/schema.prisma`:

```prisma
ageRange  String?   // e.g. "25-34"
country   String?   // country display name, e.g. "United States"
region    String?   // state/province display name, e.g. "California"
```

Store **display names**, not ISO codes: the DB/admin stays human-readable and the combobox `value === label` with zero mapping. Trade-off: localizing country names later would require a data backfill — accepted as future work, not in scope.

Apply with `npx prisma migrate dev --name add_user_demographics` (and `prisma generate` runs on build per package.json).

## Components & files

### New

- **`lib/constants/demographics.ts`**
  - Exports `AGE_RANGES: readonly string[]` = the 7 buckets above. Values are locale-independent (just numbers), so no i18n needed for the values themselves.

- **`components/forms/age-range-select.tsx`** (client)
  - Props: `value: string | undefined`, `onChange: (v: string) => void`, optional `placeholder`.
  - Renders a shadcn `Select` over `AGE_RANGES` (short list, no search).

- **`components/forms/location-select.tsx`** (client)
  - Props: `country`, `region`, `onCountryChange(name)`, `onRegionChange(name)`, plus label/placeholder strings.
  - Builds country options from `country-region-data` (sorted by name), value = label = `countryName`.
  - Region options derive from the selected country's `regions` (value = label = region `name`).
  - Behavior: changing the country resets `region`; if the selected country has no regions, the region field is disabled/hidden.
  - Renders two `Combobox` instances (searchable). Combobox already uses `t.common.selectOption / searchOption / noOptionFound`.

### Modified

- **`prisma/schema.prisma`** — three new `User` columns (above).

- **`app/api/users/me/route.ts`** (PATCH) — accept `ageRange`, `country`, `region` from the body; add each to `updateData` when `!== undefined`, mirroring the existing `name`/`image` handling.

- **`app/onboarding/_components/onboarding-form.tsx`**
  - Extend the zod schema: `name` required (unchanged); `ageRange` required; `country` required; `region` validated with a refinement — required only when the chosen country has regions.
  - Step 1 ("Información personal") now renders Name + `AgeRangeSelect` + `LocationSelect`.
  - `handleStepSubmit('personal-info', ...)` triggers RHF validation for these fields and only advances when valid.
  - `onSubmit` sends `ageRange`, `country`, `region` in the existing `axios.patch("/api/users/me", ...)` call.
  - Step 2 (avatar) unchanged.

- **`app/(dashboard)/(routes)/profile/_components/profile-form.tsx`**
  - Add `ageRange?`, `country?`, `region?` to `ProfileFormProps.initialData`.
  - Extend schema (all three optional) + `defaultValues` from `initialData`.
  - Render `AgeRangeSelect` + `LocationSelect` alongside name/phone.
  - Include the three fields in the existing `axios.patch("/api/users/me", ...)` call.

- **`app/(dashboard)/(routes)/profile/page.tsx`**
  - Pass `ageRange`, `country`, `region` from `profileData` into `ProfileForm`'s `initialData`.

- **`lib/i18n/messages.ts`** (ES + EN, `profile` namespace)
  - `ageRange`, `ageRangePlaceholder`, `country`, `countryPlaceholder`, `region`, `regionPlaceholder`.
  - ES examples: "Rango de edad" / "País" / "Estado o provincia" + matching placeholders. EN: "Age range" / "Country" / "State / Province".

## Data flow

1. Onboarding step 1: user picks name, age, country → region options populate → picks region → validation passes → advance to avatar → final `PATCH /api/users/me` writes all fields + `onboardingCompleted: true`.
2. Profile edit: fields prefill from `initialData`; on save, `PATCH /api/users/me` updates them.

## Error handling

- Onboarding validation uses existing RHF + zod `FormMessage` patterns; advancing is blocked until step-1 fields validate.
- API errors surface via the existing `toast.error(t.common.somethingWentWrong)` paths in both forms — unchanged.
- Countries with no regions: region field disabled, region treated as not-required by the refinement.

## Out of scope

- City-level selection.
- Localized (translated) country/region names.
- Showing demographics in admin user-management views.
- Backfilling demographics for existing users (new columns are nullable).

## Testing / verification

- `npx prisma migrate dev` applies cleanly; `prisma generate` produces the new fields.
- Onboarding: cannot advance past step 1 until name/age/country (+region where applicable) are filled; final submit persists all fields; user lands on the role dashboard.
- Country with regions (e.g. United States → California) and without regions both behave correctly.
- Profile edit: fields prefill, save persists, reload shows saved values.
- `next build` / `next lint` pass.
