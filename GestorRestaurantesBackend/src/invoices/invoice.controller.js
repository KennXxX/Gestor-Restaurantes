import Invoice from './invoice.model.js';
import Promotion from '../promotions/promotion.model.js';
import Order from '../orders/order.model.js';
import PDFDocument from 'pdfkit';

const generateInvoiceNumber = () => {
  const stamp = Date.now();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `FAC-${stamp}-${random}`;
};

const calculateInvoiceTotals = ({ items = [], discountPercentage = 0, shippingFee = 0 }) => {
  const subtotal = items.reduce((acc, item) => acc + ((item.price || 0) * (item.quantity || 0)), 0);
  const discountAmount = subtotal * (discountPercentage / 100);
  const total = subtotal - discountAmount + shippingFee;

  return {
    subtotal,
    discountAmount,
    totalBeforeDiscount: subtotal,
    total
  };
};

export const createInvoice = async (req, res) => {
  try {
    const payload = { ...req.body };
    payload.invoiceNumber = payload.invoiceNumber || generateInvoiceNumber();
    payload.shippingFee = Number(payload.shippingFee || 0);
    payload.discountPercentage = Number(payload.discountPercentage || 0);

    if ((!payload.items || !payload.items.length) && payload.orderId) {
      const order = await Order.findById(payload.orderId).lean();
      if (order) {
        payload.items = (order.items || []).map((item) => ({
          menuId: item.menuId,
          price: item.price,
          quantity: item.quantity
        }));
      }
    }

    const totals = calculateInvoiceTotals({
      items: payload.items || [],
      discountPercentage: payload.discountPercentage,
      shippingFee: payload.shippingFee
    });

    payload.subtotal = Number(totals.subtotal.toFixed(2));
    payload.discountAmount = Number(totals.discountAmount.toFixed(2));
    payload.totalBeforeDiscount = Number(totals.totalBeforeDiscount.toFixed(2));
    payload.total = Number(totals.total.toFixed(2));

    const inv = new Invoice(payload);
    await inv.save();
    return res.status(201).json({ success: true, invoice: inv });
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message });
  }
};

export const getInvoices = async (req, res) => {
  try {
    const { restaurantId } = req.query;
    const query = restaurantId ? { restaurantId } : {};
    const invoices = await Invoice.find(query)
      .populate('restaurantId', 'restaurantName restaurantEmail')
      .populate('orderId', 'status createdAt')
      .sort({ issuedAt: -1 });

    return res.json({ success: true, invoices });
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message });
  }
};

export const getIssuedInvoices = async (req, res) => {
  try {
    const { restaurantId } = req.query;
    const query = restaurantId ? { restaurantId } : {};

    const invoices = await Invoice.find(query)
      .populate('restaurantId', 'restaurantName')
      .sort({ issuedAt: -1 });

    return res.json({
      success: true,
      totalIssued: invoices.length,
      invoices
    });
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message });
  }
};

export const getInvoicesByRestaurant = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const invoices = await Invoice.find({ restaurantId })
      .populate('orderId', 'status createdAt')
      .sort({ issuedAt: -1 });

    return res.json({ success: true, invoices });
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message });
  }
};

export const getInvoiceById = async (req, res) => {
  try {
    const inv = await Invoice.findById(req.params.id)
      .populate('restaurantId', 'restaurantName restaurantAddress restaurantPhone')
      .populate('orderId', 'createdAt status orderType');

    if (!inv) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }
    return res.json({ success: true, invoice: inv });
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message });
  }
};

export const exportInvoicePDF = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('restaurantId', 'restaurantName restaurantAddress restaurantPhone restaurantEmail')
      .populate('items.menuId', 'menuName');

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=factura_${invoice.invoiceNumber}.pdf`);
    doc.pipe(res);

    doc.rect(0, 0, doc.page.width, 105).fill('#1e293b');
    doc.fillColor('#f8fafc').fontSize(26).text('FACTURA EMITIDA', 40, 35, { align: 'center' });
    doc.fillColor('#cbd5e1').fontSize(11).text(`No. ${invoice.invoiceNumber}`, 40, 70, { align: 'center' });

    doc.fillColor('#0f172a').fontSize(12).text('Datos del restaurante', 40, 130);
    doc.fontSize(10)
      .text(`Nombre: ${invoice.restaurantId?.restaurantName || 'N/A'}`, 40, 150)
      .text(`Dirección: ${invoice.restaurantId?.restaurantAddress || 'N/A'}`, 40, 165)
      .text(`Teléfono: ${invoice.restaurantId?.restaurantPhone || 'N/A'}`, 40, 180)
      .text(`Correo: ${invoice.restaurantId?.restaurantEmail || 'N/A'}`, 40, 195);

    doc.fontSize(12).fillColor('#0f172a').text('Detalle de productos', 40, 235);

    let y = 255;
    doc.fontSize(10).fillColor('#334155').text('Producto', 40, y).text('Cant.', 290, y).text('Precio', 350, y).text('Subtotal', 440, y);
    y += 18;
    doc.moveTo(40, y).lineTo(550, y).strokeColor('#cbd5e1').stroke();
    y += 10;

    (invoice.items || []).forEach((item) => {
      const itemSubtotal = (item.price || 0) * (item.quantity || 0);
      doc.fillColor('#0f172a')
        .text(item.menuId?.menuName || 'Producto', 40, y, { width: 240 })
        .text(String(item.quantity || 0), 300, y)
        .text(`Q${Number(item.price || 0).toFixed(2)}`, 350, y)
        .text(`Q${itemSubtotal.toFixed(2)}`, 440, y);
      y += 20;
    });

    y += 15;
    doc.moveTo(320, y).lineTo(550, y).strokeColor('#cbd5e1').stroke();
    y += 10;

    doc.fontSize(10)
      .text(`Subtotal: Q${Number(invoice.subtotal || 0).toFixed(2)}`, 350, y)
      .text(`Descuento (${invoice.discountPercentage || 0}%): -Q${Number(invoice.discountAmount || 0).toFixed(2)}`, 350, y + 15)
      .text(`Envío: Q${Number(invoice.shippingFee || 0).toFixed(2)}`, 350, y + 30);

    doc.fontSize(14).fillColor('#0f172a').text(`TOTAL: Q${Number(invoice.total || 0).toFixed(2)}`, 350, y + 55);
    doc.fontSize(10).fillColor('#475569').text(`Emitida el: ${new Date(invoice.issuedAt).toLocaleString('es-GT')}`, 40, y + 95);

    doc.end();
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message });
  }
};

export const createInvoiceFromOrder = async (order) => {
  const existing = await Invoice.findOne({ orderId: order._id });
  if (existing) {
    return existing;
  }

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

  const shippingFee = order.orderType === 'A_DOMICILIO' ? 20 : 0;
  const normalizedItems = (order.items || []).map(i => ({
    menuId: i.menuId,
    price: i.price,
    quantity: i.quantity
  }));

  const totals = calculateInvoiceTotals({
    items: normalizedItems,
    discountPercentage,
    shippingFee
  });

  const inv = new Invoice({
    invoiceNumber: generateInvoiceNumber(),
    orderId: order._id,
    restaurantId: order.restaurantId,
    customer: order.customer || {},
    items: normalizedItems,
    subtotal: Number(totals.subtotal.toFixed(2)),
    discountAmount: Number(totals.discountAmount.toFixed(2)),
    totalBeforeDiscount: Number(totals.totalBeforeDiscount.toFixed(2)),
    total: Number(totals.total.toFixed(2)),
    coupon: order.coupon || null,
    discountPercentage,
    shippingFee
  });
  return inv.save();
};
