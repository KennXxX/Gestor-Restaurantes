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

    // Restaurant admins can only see inventory from their own restaurant
    if (req.userRole === 'ADMIN_RESTAURANT' || req.userRole === 'ADMIN_RESTAURANTE') {
      const { default: Restaurant } = await import('../restaurants/restaurant.model.js');
      const myRestaurant = await Restaurant.findOne({ adminId: req.userId }).select('_id').lean();
      if (!myRestaurant) {
        return res.status(403).json({ success: false, message: 'No tienes un restaurante asignado' });
      }
      filter.restaurantId = myRestaurant._id;
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
  const existing = await Inventory.findOne({ menuId, restaurantId });
  const currentQty = existing ? existing.quantity : 0;
  if (currentQty + delta < 0) throw new Error('Stock insuficiente');
  const inv = await Inventory.findOneAndUpdate(
    { menuId, restaurantId },
    { $inc: { quantity: delta } },
    { new: true, upsert: true }
  );
  return inv;
};