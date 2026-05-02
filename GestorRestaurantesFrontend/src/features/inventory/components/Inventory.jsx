import { useState } from "react";

export const Inventory = () => {
const [items, setItems] = useState([
{
_id: "1",
name: "Pizza de Pepperoni",
restaurant: "Pizza Hut",
quantity: 50,
},
{
_id: "2",
name: "Hamburguesa Clásica",
restaurant: "McDonald's",
quantity: 30,
},
{
_id: "3",
name: "Tacos al Pastor",
restaurant: "Taco Bell",
quantity: 25,
},
{
_id: "4",
name: "Pollo Frito",
restaurant: "KFC",
quantity: 10,
},
{
_id: "5",
name: "Ensalada César",
restaurant: "Subway",
quantity: 20,
},
]);

const handleDelete = (id) => {
setItems(items.filter((item) => item._id !== id));
};

const getStockColor = (qty) => {
if (qty <= 10) return "bg-red-500";
if (qty <= 25) return "bg-yellow-400";
return "bg-green-500";
};

return ( <div className="p-6 bg-gray-100 min-h-screen"> <div className="flex justify-between items-center mb-6"> <h1 className="text-3xl font-bold text-gray-800">
Inventario del Restaurante </h1>

```
    <button className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg shadow">
      + Agregar producto
    </button>
  </div>

  <div className="grid md:grid-cols-3 gap-6">
    {items.map((item) => (
      <div
        key={item._id}
        className="bg-white rounded-xl shadow-md p-4 hover:shadow-xl transition"
      >
        <h2 className="text-xl font-semibold text-gray-800">
          {item.name}
        </h2>

        <p className="text-sm text-gray-500 mb-3">
          {item.restaurant}
        </p>

        <div className="flex justify-between items-center">
          <span
            className={`text-white text-sm px-3 py-1 rounded-full ${getStockColor(
              item.quantity
            )}`}
          >
            Stock: {item.quantity}
          </span>

          <button
            onClick={() => handleDelete(item._id)}
            className="text-red-500 hover:text-red-700"
          >
            🗑
          </button>
        </div>
      </div>
    ))}
  </div>
</div>

);
};
