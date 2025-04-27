import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  const { session_id } = req.query;

  try {
    const session = await stripe.checkout.sessions.retrieve(session_id);
    res.status(200).json(session);
  } catch (error) {
    console.error('Lỗi khi lấy session từ Stripe:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
