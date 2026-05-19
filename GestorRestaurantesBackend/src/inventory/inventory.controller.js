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

export const getInventories = async (req, res) => {
  try {
    const filter = {};
    if (req.query.restaurantId) {
      filter.restaurantId = req.query.restaurantId;
    }
    const inventories = await Inventory.find(filter).populate('menuId');
    res.json({ success: true, inventories });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
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
  const inv = await Inventory.findOneAndUpdate(
    { menuId, restaurantId },
    { $inc: { quantity: delta } },
    { new: true, upsert: true }
  );
  if (inv.quantity < 0) throw new Error('Stock insuficiente');
  return inv;
};