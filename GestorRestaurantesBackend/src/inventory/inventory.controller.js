import Inventory from './inventory.model.js';

export const createInventory = async (req, res) => {
  try {
    const inv = new Inventory(req.body);
    await inv.save();
    res.status(201).json({ success: true, inventory: inv });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

export const getInventories = async (_, res) => {
  const inventories = await Inventory.find();
  res.json({ success: true, inventories });
};

export const getInventoryById = async (req, res) => {
  const inv = await Inventory.findById(req.params.id);
  if (!inv) return res.status(404).json({ success: false, message: 'No existe' });
  res.json({ success: true, inventory: inv });
};

export const updateInventory = async (req, res) => {
  const inv = await Inventory.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!inv) return res.status(404).json({ success: false, message: 'No existe' });
  res.json({ success: true, inventory: inv });
};

export const deleteInventory = async (req, res) => {
  const inv = await Inventory.findByIdAndDelete(req.params.id);
  if (!inv) return res.status(404).json({ success: false, message: 'No existe' });
  res.json({ success: true, message: 'Eliminado' });
};

// helper para restar
export const changeStock = async (menuId, restaurantId, delta) => {
  const normalizedDelta = Number(delta) || 0;

  if (normalizedDelta === 0) {
    return Inventory.findOne({ menuId, restaurantId });
  }

  const query = { menuId, restaurantId };

  if (normalizedDelta < 0) {
    query.quantity = { $gte: Math.abs(normalizedDelta) };
  }

  const inv = await Inventory.findOneAndUpdate(
    query,
    { $inc: { quantity: normalizedDelta } },
    { new: true, upsert: normalizedDelta > 0 }
  );

  if (!inv) {
    throw new Error('Stock insuficiente');
  }

  return inv;
};