import Invoice from './invoice.model.js';
import Promotion from '../promotions/promotion.model.js';

export const createInvoice = async (req, res) => {
  try {
    const inv = new Invoice(req.body);
    await inv.save();
    return res.status(201).json({ success: true, invoice: inv });
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message });
  }
};

export const getInvoices = async (_req, res) => {
  try {
    const invoices = await Invoice.find();
    return res.json({ success: true, invoices });
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message });
  }
};

export const getInvoiceById = async (req, res) => {
  try {
    const inv = await Invoice.findById(req.params.id);
    if (!inv) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }
    return res.json({ success: true, invoice: inv });
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message });
  }
};

export const createInvoiceFromOrder = async (order) => {
  // compute discount based on promotion at the moment of invoicing
  let discountPercentage = 0;
  if (order.coupon) {
    const now = new Date();
    const promo = await Promotion.findOne({
      restaurantId: order.restaurantId,
      couponCode: order.coupon,
      isActive: true,
      isApproved: true,
      $or: [
        { startDate: null, endDate: null },
        { startDate: { $lte: now }, endDate: null },
        { startDate: null, endDate: { $gte: now } },
        { startDate: { $lte: now }, endDate: { $gte: now } }
      ]
    });
    if (promo) {
      discountPercentage = promo.discountPercentage || 0;
    }
  }

  const totalBefore = order.total;
  const totalAfter = totalBefore * (1 - discountPercentage / 100);
  const shippingFee = order.orderType === 'A_DOMICILIO' ? 20 : 0;

  const inv = new Invoice({
    orderId: order._id,
    restaurantId: order.restaurantId,
    customer: order.customer || {},
    items: (order.items || []).map(i => ({
      menuId: i.menuId,
      price: i.price,
      quantity: i.quantity
    })),
    total: totalAfter,
    coupon: order.coupon || null,
    discountPercentage,
    totalBeforeDiscount: totalBefore,
    shippingFee
  });
  return inv.save();
};
