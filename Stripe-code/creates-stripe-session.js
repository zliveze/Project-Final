import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { items, orderIds } = req.body;

    if (!items || !Array.isArray(items) || !orderIds || !Array.isArray(orderIds)) {
      res.status(400).json({ error: 'Invalid items or orderIds data' });
      return;
    }

    try {
      // Group items by orderId
      const orderItems = items.reduce((acc, item) => {
        if (!acc[item.orderId]) {
          acc[item.orderId] = [];
        }
        acc[item.orderId].push(item);
        return acc;
      }, {});

      const lineItems = [];

      Object.keys(orderItems).forEach(orderId => {
        const order = orderItems[orderId];
        const discountPrice = order[0].discountPrice || 0; // Discount for this specific order

        // Sort items by price (descending) to apply discount to the most expensive item
        order.sort((a, b) => b.amount - a.amount);

        order.forEach((item, index) => {
          let itemPrice = item.amount;
          let itemName = item.name;

          // Apply entire discount to the first (most expensive) item
          if (index === 0 && discountPrice > 0) {
            itemPrice = Math.max(0, itemPrice - discountPrice);
            itemName += ` (Đã giảm giá ${discountPrice.toLocaleString('vi-VN')} VND)`;
          }

          // Round price to nearest 100 VND
          itemPrice = Math.round(itemPrice / 100) * 100;

          lineItems.push({
            price_data: {
              currency: 'VND',
              product_data: {
                name: itemName,
              },
              unit_amount: itemPrice,
            },
            quantity: item.quantity,
          });
        });
      });

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: lineItems,
        mode: 'payment',
        success_url: `${req.headers.origin}/payments?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${req.headers.origin}/payments/cancel`,
        metadata: {
          orderIds: orderIds.join(','),
        },
      });

      res.status(200).json({ url: session.url });
    } catch (error) {
      console.error('Error creating Stripe session:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  } else {
    res.setHeader('Allow', 'POST');
    res.status(405).end('Method Not Allowed');
  }
}