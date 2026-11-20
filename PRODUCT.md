# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

React + TypeScript + Vite, CSS Modules plus a token file (`src/styles/tokens.css`). Pinned by the brief; no Tailwind, UI kits or animation libraries.

## Users

Women and men choosing a premium beauty salon on their phone or laptop, usually in the evening, comparing a few salons before booking. Their job: understand what the salon does, trust the atmosphere, and book a visit in under a minute.

## Product Purpose

Site for the beauty salon Aesthetic Body in Bryansk (Beauty Salon): home page plus «Обучение» (laser epilation training) and «Портфолио» pages. Success is a submitted booking request, or a call when online booking is not connected.

## Positioning

A calm, expensive European salon: professional care, atmosphere of comfort and attention to detail. No discount or hype tone.

## Capabilities and Constraints

- Six service directions: hair, manicure, cosmetology, skin care and massage, brows and lashes, aesthetic procedures.
- Online booking goes to `VITE_BOOKING_API_URL`; when unset, the site must say honestly that online booking is not connected and offer a phone call.
- Content and contacts live only in `src/config` and `src/data`.
- Russian-language site (`lang="ru"`), Russian typographic rules.

## Brand Commitments

- Name «Aesthetic Body», subtitle «Beauty Salon». The brief named the salon «Lumière»; the client renamed it to match the Yandex Maps profile.
- Palette pinned by the brief: `#120D17`, `#1B1421`, `#B879E8`, `#D7B6F2`, `#F5EFF8`, `#B9AFC1`, `#34263D`.
- Style pinned: Minimal Luxury / Modern Editorial; light antiqua headings with Cyrillic, modern grotesque body.
- All headline and section copy is given verbatim by the brief.

## Evidence on Hand

- Phone, address, hours (daily 10:00–21:00), socials (Telegram, VK, WhatsApp), laser-epilation prices and two 5-star reviews come from the client-supplied Yandex Maps profile (https://yandex.ru/profile/126522033047). Prices are flagged by Yandex as not recently updated.
- Services and prices on the site and in the Telegram bot come from one source: the VK price list (5 March 2024) in `bot/src/catalog.ts`. The brief's six invented directions (hair, manicure, brows, etc.) were replaced with the salon's real services at the client's request.
- Only the hero photo remains from the Yandex Maps profile; gallery, portfolio and training photos will be supplied by the client. Earlier photos came from a Yandex Maps organization profile the client supplied (https://yandex.ru/profile/126522033047): cropped without faces/logos, colour-graded. Licence and the consent of people in frame are unconfirmed (see CREDITS.md).
- No reference image was received (the brief mentions one); the layout follows the text brief.

## Product Principles

1. Air and restraint over decoration.
2. Every control does something real; nothing imitates a booking confirmation.
3. Content is editable in one place.

## Accessibility & Inclusion

WCAG 2.1 AA: contrast, full keyboard use, focus traps in overlays, reduced motion respected.
