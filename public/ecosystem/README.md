# NoriEco realistic 3D ecosystem artwork

Created with the built-in image_gen tool, transparent background enabled, one
generation per subject. These are illustrative product renders, not screenshots
of customer installations. The Amazonas diorama is not a geographic map.

Local production assets (alpha-preserving WebP, quality .88):

- `gestao-3d-{420,700}.webp`: POS terminal and receipt printer.
- `catalogo-3d-{420,700}.webp`: smartphone with restaurant catalog.
- `marketplace-3d-{420,700}.webp`: regional commerce diorama.

The website uses responsive images, lazy loading, fixed aspect ratios, and the
existing CSS hover/float effects. No WebGL or new runtime dependency was added.
Original PNGs remain in the generation archive under
`01a13fa1-09ef-74f0-8dc6-b9ff3b9e8bbd`, respectively:
`exec-14e5001b-9966-4e17-a6ac-d26b74852e76.png`,
`exec-7bea9229-c669-4691-9fb0-cf1131c3c5cf.png`,
`exec-a0830d43-53ec-4548-a7c5-f1cb38042550.png`.

## Prompt set

Each subject was appended to this common prompt:

> Use case: product-mockup. Production website illustration, premium photorealistic 3D CGI with the rich material realism of a high-end Halloween collectible render, but business subject only: NO Halloween objects or characters. Actual transparent background, no backdrop rectangle, no typography outside object, no logos, no watermark. Studio softbox lighting with delicate violet #9856df rim lighting and warm #ffac65 highlights, detailed physical materials, realistic ambient occlusion, no harsh neon, no cartoon flat vector style. Center entire object with comfortable 8% transparent margins, square composition. Object legible at 300px display, sharply rendered, all extremities inside canvas.

### POS

> Subject: One modern restaurant touchscreen POS terminal with brushed graphite metal stand and realistic glossy black glass screen, slight three-quarter front view (screen still easily visible), large touchscreen showing a beautiful simple light restaurant dashboard with three appetizing photographic food thumbnails and violet action buttons, restrained UI, only minimal Portuguese text 'Balcão', no charts or fake stats. Next to terminal at lower right a small realistic black thermal receipt printer and a short curled white paper receipt with a few grey lines (no unreadable paragraph). Whole arrangement on same invisible ground plane with soft contact shadow, isolated. Strong tangible dimensional depth, tactile beveled edges, satin metal, clear glass reflections, not a line drawing.

### Catalog

> Subject: One premium modern realistic smartphone standing vertically, slight three-quarter front view tilted gently 8 degrees, graphite titanium sides with visible thickness and rounded glass corners, subtle glossy reflections. Full screen shows a polished bright restaurant online ordering catalog, top title 'Cardápio', two large beautiful real food photos: gourmet burger and a plate of grilled fish with rice, small clear product names and Brazilian prices 'R$ 28,00' and 'R$ 32,00', simple violet add buttons and bottom violet 'Ver pedido' button. The PHONE is the sole object. No floating cards, no props, no pedestal. Beautiful luxury product photograph dimensional 3D render, large phone occupies 85% image height.

### Marketplace

> Subject: One premium photorealistic miniature isometric regional map diorama inspired by Amazonas, intentionally illustrative not geographically exact: irregular organic land silhouette with physically thick earth cutaway edges, restrained soft green textured terrain, one beautiful winding blue-violet river with realistic water reflections, 4 small detailed local shop buildings with pale stucco and violet/terracotta accents connected by narrow refined paths, 3 elegant violet glossy 3D location pins floating just above selected buildings. Map is THE ONLY OBJECT. No text, business logos, labels, badges, extra icon cards, platform circle or outside props. Just a few tiny tropical plants for scale, uncluttered, not a dense city. Elevated isometric camera 35 degrees from above, warm and violet subtle lighting, tiny physical windows, roofs and shadows, realistic terrain relief, premium handcrafted architectural model realism.
