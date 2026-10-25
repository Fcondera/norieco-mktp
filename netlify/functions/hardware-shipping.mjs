import { createShippingHandler } from '../lib/hardware-shipping.mjs';
export default createShippingHandler();
export const config = {rateLimit: {action: 'rate_limit', windowLimit: 15, windowSize: 60, aggregateBy: ['ip','domain']}};
