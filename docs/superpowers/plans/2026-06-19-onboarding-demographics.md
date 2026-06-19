# Onboarding & Profile Demographics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Collect age range, country, and state/province during onboarding (required) and let users edit them on the profile page (optional).

**Architecture:** Three new nullable `User` columns store display-name strings. A normalized data wrapper (`lib/constants/countries.ts`) isolates the `country-region-data` package behind a clean typed API. Two shared client components (`AgeRangeSelect`, `LocationSelect`) render via the app's existing shadcn `Select`/`Combobox`, and are dropped into both the onboarding wizard and the profile edit form. Both forms already PATCH `/api/users/me`, so only that one endpoint changes server-side.

**Tech Stack:** Next.js (App Router), Prisma + PostgreSQL, react-hook-form + zod, shadcn/ui, `country-region-data`, i18n via `lib/i18n` (`useLocale` client / `getServerMessages` server).

## Global Constraints

- **No test runner exists** in this repo. Verification per task = `npx tsc --noEmit` (type check), `yarn lint` (next lint), and where stated `yarn build` + manual runtime check. Do **not** add a test framework.
- **i18n is mandatory** for all user-facing strings: add keys to BOTH the ES block (~line 238–259 `profile`) and the EN block (~line 1080–1101 `profile`) of `lib/i18n/messages.ts`. Never hardcode UI text.
- **Age buckets (verbatim):** `13-17`, `18-24`, `25-34`, `35-44`, `45-54`, `55-64`, `65+`.
- **Storage format:** `country` and `region` store **display names** (e.g. `"United States"`, `"California"`), not ISO codes. `ageRange` stores the bucket string verbatim.
- **Commit discipline:** repo default branch is `main`. Commit per task with the messages shown. End every commit message with the Co-Authored-By trailer:
  `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`
- Follow existing patterns: shadcn `Select` (see `app/(dashboard)/(routes)/admin/courses/[courseId]/course-modules/[moduleId]/_components/chapters-form.tsx:26-30,144-164`) and `Combobox` (`components/ui/combobox.tsx`, which already reads `t.common.selectOption / searchOption / noOptionFound`).

---

### Task 1: Constants + country data wrapper

**Files:**
- Modify: `package.json` (add `country-region-data` dependency)
- Create: `lib/constants/demographics.ts`
- Create: `lib/constants/countries.ts`
- Create (only if step 4 requires): `types/country-region-data.d.ts`

**Interfaces:**
- Produces:
  - `AGE_RANGES: readonly string[]` and `type AgeRange` from `lib/constants/demographics.ts`
  - `interface CountryOption { name: string; regions: string[] }`, `COUNTRIES: CountryOption[]`, `getRegionsForCountry(countryName: string): string[]`, `countryHasRegions(countryName: string): boolean` from `lib/constants/countries.ts`

- [ ] **Step 1: Add the dependency**

Run:
```bash
yarn add country-region-data
```
Expected: `country-region-data` appears under `dependencies` in `package.json`; `node_modules/country-region-data` exists.

- [ ] **Step 2: Confirm the package's runtime export shape**

Run:
```bash
node -e "const m=require('country-region-data'); const arr=Array.isArray(m)?m:(m.default||m.allCountries); console.log('isArray:',Array.isArray(arr),'len:',arr&&arr.length); console.log(JSON.stringify(arr[0]).slice(0,220));"
```
Expected: `isArray: true` with a length ~250, and the first element showing `countryName`, `countryShortCode`, and a `regions` collection. Note whether each region is an object (`{"name":"...","shortCode":"..."}`) or a tuple (`["Name","code"]`) — the wrapper in Step 3 handles both, but confirm it matches.

- [ ] **Step 3: Create `lib/constants/demographics.ts`**

```ts
export const AGE_RANGES = [
  "13-17",
  "18-24",
  "25-34",
  "35-44",
  "45-54",
  "55-64",
  "65+",
] as const;

export type AgeRange = (typeof AGE_RANGES)[number];
```

- [ ] **Step 4: Create `lib/constants/countries.ts`**

```ts
import * as countryRegionData from "country-region-data";

// country-region-data may export the array directly, under `.default`, or as
// `allCountries` depending on the build/bundler. Normalize defensively.
const raw: any[] =
  (Array.isArray(countryRegionData as any) && (countryRegionData as any)) ||
  (countryRegionData as any).default ||
  (countryRegionData as any).allCountries ||
  [];

export interface CountryOption {
  /** Display name, e.g. "United States". Used as both label and stored value. */
  name: string;
  /** Region display names, e.g. ["Alabama", "Alaska", ...]. */
  regions: string[];
}

export const COUNTRIES: CountryOption[] = raw
  .map((c) => ({
    name: c.countryName,
    // Region entries are either { name, shortCode } objects or [name, code] tuples.
    regions: (c.regions ?? []).map((r: any) => (Array.isArray(r) ? r[0] : r.name)),
  }))
  .sort((a, b) => a.name.localeCompare(b.name));

export function getRegionsForCountry(countryName: string): string[] {
  return COUNTRIES.find((c) => c.name === countryName)?.regions ?? [];
}

export function countryHasRegions(countryName: string): boolean {
  return getRegionsForCountry(countryName).length > 0;
}
```

- [ ] **Step 5: Type-check; add a module declaration only if needed**

Run:
```bash
npx tsc --noEmit
```
Expected: PASS. If it fails with `TS7016 Could not find a declaration file for module 'country-region-data'`, create `types/country-region-data.d.ts`:
```ts
declare module "country-region-data";
```
Then re-run `npx tsc --noEmit` until PASS.

- [ ] **Step 6: Commit**

```bash
git add package.json yarn.lock lib/constants/demographics.ts lib/constants/countries.ts types/country-region-data.d.ts
git commit -m "feat: add demographics constants and country-region data wrapper

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```
(Omit `types/country-region-data.d.ts` from the add if Step 5 did not create it.)

---

### Task 2: Data model + API endpoint

**Files:**
- Modify: `prisma/schema.prisma:24` (User model, after the `image String?` line)
- Modify: `app/api/users/me/route.ts:14-19`

**Interfaces:**
- Produces: `User.ageRange`, `User.country`, `User.region` (all `String?`); `PATCH /api/users/me` now accepts `{ ageRange?, country?, region? }`.

- [ ] **Step 1: Add columns to the User model**

In `prisma/schema.prisma`, inside `model User`, add these three lines immediately after `image String?` (line 24) and before `onboardingCompleted`:
```prisma
  ageRange            String?
  country             String?
  region              String?
```

- [ ] **Step 2: Create and apply the migration**

Run:
```bash
npx prisma migrate dev --name add_user_demographics
```
Expected: a new folder under `prisma/migrations/` is created, the migration applies to the database, and the Prisma client regenerates with the three new fields. (Requires `DATABASE_URL`/`DIRECT_URL` from `.env`.)

- [ ] **Step 3: Accept the new fields in the PATCH handler**

In `app/api/users/me/route.ts`, replace the destructure + updateData block (lines 14–19):
```ts
        const { name, imageUrl, onboardingCompleted } = body;

        const updateData: any = {};
        if (name !== undefined) updateData.name = name;
        if (imageUrl !== undefined) updateData.image = imageUrl;
        if (onboardingCompleted !== undefined) updateData.onboardingCompleted = onboardingCompleted;
```
with:
```ts
        const { name, imageUrl, onboardingCompleted, ageRange, country, region } = body;

        const updateData: any = {};
        if (name !== undefined) updateData.name = name;
        if (imageUrl !== undefined) updateData.image = imageUrl;
        if (onboardingCompleted !== undefined) updateData.onboardingCompleted = onboardingCompleted;
        if (ageRange !== undefined) updateData.ageRange = ageRange;
        if (country !== undefined) updateData.country = country;
        if (region !== undefined) updateData.region = region;
```

- [ ] **Step 4: Type-check**

Run:
```bash
npx tsc --noEmit
```
Expected: PASS (the Prisma client now knows `ageRange`/`country`/`region`).

- [ ] **Step 5: Commit**

```bash
git add prisma/schema.prisma prisma/migrations app/api/users/me/route.ts
git commit -m "feat: persist age range, country and region on user

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 3: i18n strings (ES + EN)

**Files:**
- Modify: `lib/i18n/messages.ts` (ES `profile` block ~line 245; EN `profile` block ~line 1087)

**Interfaces:**
- Produces: `t.profile.ageRange`, `t.profile.ageRangePlaceholder`, `t.profile.country`, `t.profile.countryPlaceholder`, `t.profile.region`, `t.profile.regionPlaceholder` in both locales.

- [ ] **Step 1: Add ES keys**

In `lib/i18n/messages.ts`, in the **ES** `profile` object, immediately after the line `fullNamePlaceholder: "Tu nombre completo",` (line 245), add:
```ts
    ageRange: "Rango de edad",
    ageRangePlaceholder: "Selecciona tu rango de edad",
    country: "País",
    countryPlaceholder: "Selecciona tu país",
    region: "Estado o provincia",
    regionPlaceholder: "Selecciona tu estado o provincia",
```

- [ ] **Step 2: Add EN keys**

In the **EN** `profile` object, immediately after the line `fullNamePlaceholder: "Your full name",` (line 1087), add:
```ts
    ageRange: "Age range",
    ageRangePlaceholder: "Select your age range",
    country: "Country",
    countryPlaceholder: "Select your country",
    region: "State / Province",
    regionPlaceholder: "Select your state or province",
```

- [ ] **Step 3: Type-check**

Run:
```bash
npx tsc --noEmit
```
Expected: PASS (ES and EN message shapes stay symmetric; mismatched keys would error).

- [ ] **Step 4: Commit**

```bash
git add lib/i18n/messages.ts
git commit -m "feat: add demographics i18n strings (es/en)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 4: AgeRangeSelect component

**Files:**
- Create: `components/forms/age-range-select.tsx`

**Interfaces:**
- Consumes: `AGE_RANGES` (Task 1); `Select*` from `@/components/ui/select`.
- Produces: `AgeRangeSelect` — props `{ value?: string; onChange: (v: string) => void; placeholder?: string }`

**Note on country/region:** there is no `LocationSelect` component. Country and region are rendered inline as `FormField`s in each consuming form (Tasks 5 & 6), each using the existing `Combobox` under its own `FormLabel`, backed by `COUNTRIES` / `getRegionsForCountry` / `countryHasRegions` from Task 1. This keeps each dropdown clearly labelled and uses the codebase's established inline-`FormField` form pattern.

- [ ] **Step 1: Create `components/forms/age-range-select.tsx`**

```tsx
"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AGE_RANGES } from "@/lib/constants/demographics";

interface AgeRangeSelectProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function AgeRangeSelect({ value, onChange, placeholder }: AgeRangeSelectProps) {
  return (
    <Select value={value || undefined} onValueChange={onChange}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {AGE_RANGES.map((range) => (
          <SelectItem key={range} value={range}>
            {range}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
```

- [ ] **Step 2: Type-check + lint**

Run:
```bash
npx tsc --noEmit && yarn lint
```
Expected: PASS, no errors for the new file.

- [ ] **Step 3: Commit**

```bash
git add components/forms/age-range-select.tsx
git commit -m "feat: add AgeRangeSelect component

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 5: Onboarding wizard wiring

**Files:**
- Modify: `app/onboarding/_components/onboarding-form.tsx`

**Interfaces:**
- Consumes: `AgeRangeSelect`, `LocationSelect` (Task 4); `countryHasRegions` (Task 1); `t.profile.*` keys (Task 3); PATCH `/api/users/me` fields (Task 2).

- [ ] **Step 1: Add imports**

In `app/onboarding/_components/onboarding-form.tsx`, after the existing `import { useLocale } from "@/lib/i18n";` line (line 33), add:
```tsx
import { AgeRangeSelect } from "@/components/forms/age-range-select";
import Combobox from "@/components/ui/combobox";
import { COUNTRIES, getRegionsForCountry, countryHasRegions } from "@/lib/constants/countries";
```

- [ ] **Step 2: Extend the zod schema**

Replace the schema (lines 111–114):
```tsx
  const formSchema = z.object({
    name: z.string().min(1, t.validation.nameRequired),
    imageUrl: z.string().optional(),
  });
```
with:
```tsx
  const formSchema = z
    .object({
      name: z.string().min(1, t.validation.nameRequired),
      ageRange: z.string().min(1, t.validation.fieldRequired),
      country: z.string().min(1, t.validation.fieldRequired),
      region: z.string().optional(),
      imageUrl: z.string().optional(),
    })
    .refine((data) => !countryHasRegions(data.country) || !!data.region, {
      message: t.validation.fieldRequired,
      path: ["region"],
    });
```

- [ ] **Step 3: Confirm `t.validation.fieldRequired` exists; add it if missing**

Run:
```bash
grep -n "fieldRequired" lib/i18n/messages.ts
```
If it returns nothing, add `fieldRequired: "Este campo es obligatorio",` to the ES `validation` block and `fieldRequired: "This field is required",` to the EN `validation` block of `lib/i18n/messages.ts` (locate with `grep -n "nameRequired" lib/i18n/messages.ts` and insert beside it in both locales).

- [ ] **Step 4: Add defaults**

Replace `defaultValues` (lines 132–135):
```tsx
    defaultValues: {
      name: pendingInvitation?.name || "",
      imageUrl: "",
    },
```
with:
```tsx
    defaultValues: {
      name: pendingInvitation?.name || "",
      ageRange: "",
      country: "",
      region: "",
      imageUrl: "",
    },
```

- [ ] **Step 5: Validate step 1 before advancing**

Replace the `personal-info` button's `onClick` (line 265):
```tsx
                  onClick={() => handleStepSubmit('personal-info', { name: form.getValues('name') })}
```
with a handler that validates the three step-1 fields first:
```tsx
                  onClick={async () => {
                    const valid = await form.trigger(["name", "ageRange", "country", "region"]);
                    if (!valid) return;
                    handleStepSubmit('personal-info', {
                      name: form.getValues('name'),
                      ageRange: form.getValues('ageRange'),
                      country: form.getValues('country'),
                      region: form.getValues('region'),
                    });
                  }}
```

- [ ] **Step 6: Render the new fields in step 1**

In the `currentStepIndex === 0` block, immediately after the closing `/>` of the existing name `FormField` (line 261, before the `<Button ...>`), add the age, country, and conditional region fields. `form.watch("country")` drives both the region options and whether the region field shows; changing country resets region:
```tsx
                <FormField
                  control={form.control}
                  name="ageRange"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.profile.ageRange}</FormLabel>
                      <FormControl>
                        <AgeRangeSelect
                          value={field.value}
                          onChange={field.onChange}
                          placeholder={t.profile.ageRangePlaceholder}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.profile.country}</FormLabel>
                      <FormControl>
                        <Combobox
                          options={COUNTRIES.map((c) => ({ label: c.name, value: c.name }))}
                          value={field.value}
                          onChange={(v) => {
                            form.setValue("country", v as string, { shouldValidate: true });
                            form.setValue("region", "", { shouldValidate: true });
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {countryHasRegions(form.watch("country")) && (
                  <FormField
                    control={form.control}
                    name="region"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.profile.region}</FormLabel>
                        <FormControl>
                          <Combobox
                            options={getRegionsForCountry(form.watch("country")).map((r) => ({
                              label: r,
                              value: r,
                            }))}
                            value={field.value}
                            onChange={(v) =>
                              form.setValue("region", v as string, { shouldValidate: true })
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
```

- [ ] **Step 7: Send the new fields on final submit**

In `onSubmit`, update the PATCH payload (lines 169–173) to include the new values:
```tsx
      const response = await axios.patch("/api/users/me", {
        name: values.name,
        ageRange: values.ageRange,
        country: values.country,
        region: values.region,
        imageUrl: imageUrl,
        onboardingCompleted: true,
      });
```

- [ ] **Step 8: Type-check + lint**

Run:
```bash
npx tsc --noEmit && yarn lint
```
Expected: PASS.

- [ ] **Step 9: Manual runtime check**

Run `yarn dev`, sign in as a fresh (non-onboarded) user, open `/onboarding`. Verify: the "Continuar" button does nothing until Name + Age + Country are filled; selecting a country with states (e.g. United States) reveals the region combobox and requires it; selecting a country with no regions (e.g. Vatican City) does not require region; completing both steps lands you on the role dashboard. Confirm in the DB (or via the profile page in Task 6) that `ageRange`, `country`, `region` were saved.

- [ ] **Step 10: Commit**

```bash
git add app/onboarding/_components/onboarding-form.tsx lib/i18n/messages.ts
git commit -m "feat: collect age, country and region during onboarding

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 6: Profile edit page wiring

**Files:**
- Modify: `app/(dashboard)/(routes)/profile/page.tsx` (pass new fields to the form)
- Modify: `app/(dashboard)/(routes)/profile/_components/profile-form.tsx`

**Interfaces:**
- Consumes: `AgeRangeSelect`, `LocationSelect` (Task 4); `t.profile.*` (Task 3); `User.ageRange/country/region` (Task 2).

- [ ] **Step 1: Pass the fields from the page**

In `app/(dashboard)/(routes)/profile/page.tsx`, find where `<ProfileForm initialData={...} />` is rendered (after the section read in this plan, further down the file). Add `ageRange`, `country`, and `region` from `profileData` to the `initialData` object passed in. For example, if it currently passes `{ name: profileData.name, phone: profileData.phone, image: profileData.image, email: ..., role: ... }`, add:
```tsx
              ageRange: profileData.ageRange,
              country: profileData.country,
              region: profileData.region,
```
(`profileData` comes from `prisma.user.findUnique`, which returns all scalar columns, so no `select` change is needed.)

- [ ] **Step 2: Extend `ProfileFormProps`**

In `app/(dashboard)/(routes)/profile/_components/profile-form.tsx`, extend the `initialData` shape (lines 30–36):
```tsx
  initialData: {
    name: string | null;
    phone?: string | null;
    image?: string | null;
    email?: string;
    role?: UserRole;
    ageRange?: string | null;
    country?: string | null;
    region?: string | null;
  };
```

- [ ] **Step 3: Add imports**

The form primitives (`FormItem`, `FormControl`, `FormLabel`, `FormMessage`, etc.) are already imported at the top of this file. Add the new imports after `import { useLocale } from "@/lib/i18n";` (line 27):
```tsx
import { AgeRangeSelect } from "@/components/forms/age-range-select";
import Combobox from "@/components/ui/combobox";
import { COUNTRIES, getRegionsForCountry, countryHasRegions } from "@/lib/constants/countries";
```

- [ ] **Step 4: Extend schema + defaults**

Replace the schema (lines 45–50):
```tsx
  const formSchema = z.object({
    name: z.string().min(1, {
      message: t.validation.nameRequired,
    }),
    phone: z.string().optional(),
  });
```
with:
```tsx
  const formSchema = z.object({
    name: z.string().min(1, {
      message: t.validation.nameRequired,
    }),
    phone: z.string().optional(),
    ageRange: z.string().optional(),
    country: z.string().optional(),
    region: z.string().optional(),
  });
```
Replace `defaultValues` (lines 54–57):
```tsx
    defaultValues: {
      name: initialData.name || "",
      phone: initialData.phone || "",
    },
```
with:
```tsx
    defaultValues: {
      name: initialData.name || "",
      phone: initialData.phone || "",
      ageRange: initialData.ageRange || "",
      country: initialData.country || "",
      region: initialData.region || "",
    },
```

- [ ] **Step 5: Render the fields**

In the "Form Fields" section, after the `phone` `FormField` closes (line 172, before the closing `</div>` at line 173), add the age, country, and conditional region fields (mirrors the onboarding layout; all optional here):
```tsx
          <FormField
            control={form.control}
            name="ageRange"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t.profile.ageRange}</FormLabel>
                <FormControl>
                  <AgeRangeSelect
                    value={field.value}
                    onChange={field.onChange}
                    placeholder={t.profile.ageRangePlaceholder}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="country"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t.profile.country}</FormLabel>
                <FormControl>
                  <Combobox
                    options={COUNTRIES.map((c) => ({ label: c.name, value: c.name }))}
                    value={field.value}
                    onChange={(v) => {
                      form.setValue("country", v as string);
                      form.setValue("region", "");
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {countryHasRegions(form.watch("country") ?? "") && (
            <FormField
              control={form.control}
              name="region"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.profile.region}</FormLabel>
                  <FormControl>
                    <Combobox
                      options={getRegionsForCountry(form.watch("country") ?? "").map((r) => ({
                        label: r,
                        value: r,
                      }))}
                      value={field.value}
                      onChange={(v) => form.setValue("region", v as string)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
```

- [ ] **Step 6: Include the fields in the PATCH**

The existing `onSubmit` spreads `...values` into the PATCH body (lines 64–67), so `ageRange`, `country`, and `region` are already sent once they're in the schema. No change needed — confirm by reading `onSubmit`.

- [ ] **Step 7: Type-check + lint**

Run:
```bash
npx tsc --noEmit && yarn lint
```
Expected: PASS.

- [ ] **Step 8: Manual runtime check**

Run `yarn dev`, open `/profile` as the user onboarded in Task 5. Verify the Age/Country/Region fields prefill with the saved values, that changing country resets/repopulates regions, that saving shows the success toast, and that reloading the page shows the updated values.

- [ ] **Step 9: Commit**

```bash
git add "app/(dashboard)/(routes)/profile/page.tsx" "app/(dashboard)/(routes)/profile/_components/profile-form.tsx"
git commit -m "feat: edit age, country and region on profile page

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Final verification

- [ ] **Step 1: Full build**

Run:
```bash
yarn build
```
Expected: build succeeds (this also runs `prisma generate`). Confirm no type errors and that `country-region-data` bundles without ESM resolution errors. If the build fails on the import, revisit `lib/constants/countries.ts` Step 4 and switch the import specifier to `country-region-data/dist/data-umd`, then rebuild.

- [ ] **Step 2: End-to-end sanity**

With `yarn dev`: complete onboarding as a brand-new user (required fields enforced), then open `/profile` and confirm the same values appear and are editable. Done.
