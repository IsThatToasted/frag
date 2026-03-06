# Static Fragrance Storefront

A dark-theme, Shopify-inspired static storefront that works on GitHub Pages.

## Files
- `index.html` — main storefront markup
- `styles.css` — dark premium styling
- `app.js` — product rendering, filtering, cart drawer
- `products.json` — editable product data

## How to edit products
Open `products.json` and change:
- `name`
- `brand`
- `collection`
- `price`
- `size`
- `notes`
- `styleTags`
- `badge`
- `image`

## Recommended image setup
For production, replace the dummy image URLs with local paths like:
- `imgs/afnan-9pm.png`
- `imgs/khamrah.png`

Then create an `imgs` folder in the repo and upload your product photos there.

## Deploy on GitHub Pages
1. Upload all files to your repo root.
2. In GitHub, open **Settings → Pages**
3. Deploy from the main branch root.
4. Your store should load automatically.

## Next upgrades
- Replace demo checkout button with Stripe Checkout
- Add product detail pages
- Add announcement sliders and collection banners
- Add a mobile menu
