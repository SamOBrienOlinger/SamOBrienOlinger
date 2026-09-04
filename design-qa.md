# Design QA — portfolio navigation and responsive controls

## Scope

- Deployed branch: `portfolio-redesign`
- Verified commit: `697b4987de63efdd2de22514769babd51e1a475a`
- Live URL: `https://samobrienolinger.github.io/SamOBrienOlinger/?release=697b498`
- Reference state: desktop, light theme, top of page
- Reference viewport: 1363 × 936 CSS pixels at DPR 1

## Visual comparison

- Source screenshot: `/workspace/scratch/portfolio-responsive-desktop-20260904.jpg`
- Implementation screenshot: `/workspace/scratch/portfolio-responsive-after-20260904.jpg`
- Side-by-side comparison: `/workspace/scratch/portfolio-responsive-comparison-20260904.jpg`

The desktop composition, typography, spacing, colours, image treatment and copy remain visually stable. The responsive work is intentionally concentrated below the 851 px breakpoint, so the desktop comparison shows no unintended layout drift.

## Responsive and interaction evidence

- Android Chromium profiles: 360 × 800 and 412 × 915
- iOS WebKit profiles: 375 × 667 and 393 × 852
- Eight automated checks passed across the four profiles.
- Mobile menu opens visibly, reports `aria-expanded="true"`, closes after link selection, and closes with Escape while restoring focus.
- Header identity, theme control, contact control and all navigation links meet a minimum 44 px touch height.
- Safe-area-aware horizontal padding is applied at mobile widths.
- No horizontal document overflow was detected; project cards remain inside the viewport.
- Desktop verification at 1363 × 936 found zero horizontal overflow, all project cards within the viewport and no failed images.
- Theme switching was verified from light to dark and back to light.
- No site-origin console errors were present. Browser-extension metadata errors were excluded because they do not originate from the site.

## Fidelity surfaces

- Typography: passed
- Spacing and alignment: passed
- Colour and contrast treatment: passed
- Image quality and cropping: passed
- Copy and project order: passed
- Navigation and interaction states: passed

## Limitations

The mobile checks use production browser engines and representative device profiles in automated CI. They are not measurements from physical Android and iOS handsets, so hardware-specific browser chrome and vendor accessibility settings remain suitable candidates for a final manual spot check.

## Final result

passed
