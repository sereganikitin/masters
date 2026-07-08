// Central place for the promo-price rule so the catalog and the lot card agree.
//
// The feed price (mcdsoft_price) is the FULL price — shown struck through.
// The large, headline price is that minus a 10% discount ("−10% при 100% оплате").

export const DISCOUNT_RATE = 0.1;

/** Headline promo price = feed price × 0.9. */
export const discountedPrice = (feedPrice: number) =>
  Math.round(feedPrice * (1 - DISCOUNT_RATE));

/** Promo price per m², derived from the discounted price to stay consistent. */
export const discountedPricePerMeter = (feedPrice: number, area: number) =>
  area > 0 ? Math.round(discountedPrice(feedPrice) / area) : 0;
