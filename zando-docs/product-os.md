# Zando V2 — Product OS

## What is Zando?

Zando is a Merchant Operating System built for Congolese shops, suppliers, and logistics operators. It replaces paper-based and WhatsApp-based workflows with a structured, role-aware digital system.

## Target market

- Small to medium retail shops in DRC (Kinshasa and other cities)
- Wholesale suppliers delivering to those shops
- Logistics operators (transporteurs) moving goods between suppliers and shops

## Core value proposition

| Problem | Zando solution |
|---|---|
| Shops lose track of stock | Real-time inventory per shop |
| Orders happen over WhatsApp | Structured order → delivery flow |
| No payment history | Linked payments to orders |
| Suppliers can't see demand | Supplier portal with order visibility |
| Owners can't monitor staff | Activity log and role-based access |

## MVP scope

Zando V2 MVP covers one complete vertical loop:

**Shop owner** places an order from a **supplier** → **delivery operator** picks it up → goods arrive → **stock is updated** → **payment is recorded**.

Every action is tied to a role. Every stock change has an audit trail.

## Out of scope for MVP

- Customer-facing storefront (B2C)
- Multi-currency FX conversion
- Automated reorder triggers
- Mobile native app (PWA is sufficient for now)
- SMS/push notifications

## Design principles

- Mobile-first: primary users are on Android phones with variable internet
- French-language ready: UI labels must support French strings
- Role isolation: a shop_owner sees only their shop's data by default
- No mock data in production pages: all data flows through the database
