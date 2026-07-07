import Restaurant from '../src/restaurants/restaurant.model.js';
import Menu from '../src/menus/menu.model.js';
import Promotion from '../src/promotions/promotion.model.js';
import Inventory from '../src/inventory/inventory.model.js';
import Review from '../src/reviews/review.model.js';
import Table from '../src/tables/table.model.js';

export const seedData = async () => {
    try {
        // Buscar si ya existe el restaurante
        let restaurant = await Restaurant.findOne({ restaurantEmail: "contacto@gestor.local" });
        
        if (!restaurant) {
            restaurant = await Restaurant.create({
                restaurantName: "Restaurante Central",
                restaurantAddress: "Avenida Principal 123",
                restaurantPhone: "12345678",
                restaurantEmail: "contacto@gestor.local",
                openingHours: "08:00",
                closingHours: "22:00",
                restaurantActive: true,
                restaurantPhoto: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80",
                adminId: null // O el ID del admin si lo necesitas
            });
            console.log("🌱 Restaurante por defecto creado exitosamente.");

            // Crear menús asociados a este restaurante
            const menus = [
                {
                    menuName: "Ensalada César",
                    menuDescription: "Lechuga, crutones, queso parmesano y aderezo especial.",
                    menuPrice: 45.00,
                    menuCategory: "ENTRADA",
                    menuPhoto: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80",
                    restaurantId: restaurant._id
                },
                {
                    menuName: "Pollo a la Parrilla",
                    menuDescription: "Pechuga de pollo a la parrilla con papas asadas y vegetales.",
                    menuPrice: 85.00,
                    menuCategory: "PLATO_FUERTE",
                    menuPhoto: "https://images.unsplash.com/photo-1598514982205-f36b96d1e8d4?auto=format&fit=crop&w=800&q=80",
                    restaurantId: restaurant._id
                },
                {
                    menuName: "Pastel de Tres Leches",
                    menuDescription: "Clásico pastel empapado en tres tipos de leche.",
                    menuPrice: 35.00,
                    menuCategory: "POSTRE",
                    menuPhoto: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80",
                    restaurantId: restaurant._id
                },
                {
                    menuName: "Limonada con Menta",
                    menuDescription: "Bebida refrescante natural.",
                    menuPrice: 15.00,
                    menuCategory: "BEBIDA",
                    menuPhoto: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=800&q=80",
                    restaurantId: restaurant._id
                }
            ];

            const insertedMenus = await Menu.insertMany(menus);
            console.log("🌱 Menús por defecto creados exitosamente.");

            // Crear inventario por defecto
            const inventories = insertedMenus.map(m => ({
                menuId: m._id,
                restaurantId: m.restaurantId,
                quantity: 100
            }));
            await Inventory.insertMany(inventories);
            console.log("🌱 Inventario por defecto creado exitosamente.");

            // Crear reseñas por defecto
            const reviews = [
                {
                    restaurantId: restaurant._id,
                    rating: 5,
                    comment: "Excelente servicio y comida deliciosa. Muy recomendado.",
                    userName: "María Pérez"
                },
                {
                    restaurantId: restaurant._id,
                    rating: 4,
                    comment: "Buen ambiente, aunque la comida tardó un poco.",
                    userName: "Carlos G."
                }
            ];
            await Review.insertMany(reviews);
            console.log("🌱 Reseñas por defecto creadas exitosamente.");

            // Crear promociones por defecto
            const promotions = [
                {
                    restaurantId: restaurant._id,
                    title: "Descuento de Verano",
                    description: "Disfruta un 20% de descuento en todos los postres por la temporada de verano.",
                    couponCode: "VERANO20",
                    discountPercentage: 20,
                    startDate: new Date(),
                    endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)), // Válido por 1 mes
                    isApproved: true,
                    isActive: true
                },
                {
                    restaurantId: restaurant._id,
                    title: "Oferta Especial Estudiantes",
                    description: "15% de descuento presentando carnet de estudiante en almuerzos.",
                    couponCode: "ESTUDIANTE15",
                    discountPercentage: 15,
                    startDate: new Date(),
                    endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)), // Válido por 1 año
                    isApproved: true,
                    isActive: true
                }
            ];
            await Promotion.insertMany(promotions);
            console.log("🌱 Promociones por defecto creadas exitosamente.");

            // Crear mesas por defecto
            const tables = [
                {
                    tableName: "Mesa 1",
                    tableCapacity: 2,
                    restaurantId: restaurant._id,
                    tableActive: true
                },
                {
                    tableName: "Mesa 2",
                    tableCapacity: 4,
                    restaurantId: restaurant._id,
                    tableActive: true
                },
                {
                    tableName: "Mesa 3",
                    tableCapacity: 4,
                    restaurantId: restaurant._id,
                    tableActive: true
                },
                {
                    tableName: "Mesa 4",
                    tableCapacity: 6,
                    restaurantId: restaurant._id,
                    tableActive: true
                },
                {
                    tableName: "Mesa 5",
                    tableCapacity: 8,
                    restaurantId: restaurant._id,
                    tableActive: true
                }
            ];
            await Table.insertMany(tables);
            console.log("🌱 Mesas por defecto creadas exitosamente.");
        } else {
            console.log("Los datos por defecto ya se encuentran registrados. Actualizando imágenes si es necesario...");
            await Restaurant.updateOne(
                { _id: restaurant._id },
                { $set: { restaurantPhoto: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80" } }
            );
            
            await Menu.updateOne({ menuName: "Ensalada César" }, { $set: { menuPhoto: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80" } });
            await Menu.updateOne({ menuName: "Pollo a la Parrilla" }, { $set: { menuPhoto: "https://images.unsplash.com/photo-1598514982205-f36b96d1e8d4?auto=format&fit=crop&w=800&q=80" } });
            await Menu.updateOne({ menuName: "Pastel de Tres Leches" }, { $set: { menuPhoto: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80" } });
            await Menu.updateOne({ menuName: "Limonada con Menta" }, { $set: { menuPhoto: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=800&q=80" } });
            console.log("📸 Imágenes por defecto actualizadas.");

            // Verificar si ya hay promociones, si no, agregarlas
            const existingPromotions = await Promotion.countDocuments({ restaurantId: restaurant._id });
            if (existingPromotions === 0) {
                const promotions = [
                    {
                        restaurantId: restaurant._id,
                        title: "Descuento de Verano",
                        description: "Disfruta un 20% de descuento en todos los postres por la temporada de verano.",
                        couponCode: "VERANO20",
                        discountPercentage: 20,
                        startDate: new Date(),
                        endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
                        isApproved: true,
                        isActive: true
                    },
                    {
                        restaurantId: restaurant._id,
                        title: "Oferta Especial Estudiantes",
                        description: "15% de descuento presentando carnet de estudiante en almuerzos.",
                        couponCode: "ESTUDIANTE15",
                        discountPercentage: 15,
                        startDate: new Date(),
                        endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
                        isApproved: true,
                        isActive: true
                    }
                ];
                await Promotion.insertMany(promotions);
                console.log("🌱 Promociones por defecto añadidas al restaurante existente.");
            }

            // Verificar si hay inventario, si no, agregarlo
            const existingInventory = await Inventory.countDocuments({ restaurantId: restaurant._id });
            if (existingInventory === 0) {
                const restaurantMenus = await Menu.find({ restaurantId: restaurant._id });
                const inventories = restaurantMenus.map(m => ({
                    menuId: m._id,
                    restaurantId: restaurant._id,
                    quantity: 100
                }));
                if (inventories.length > 0) {
                    await Inventory.insertMany(inventories);
                    console.log("🌱 Inventario por defecto añadido al restaurante existente.");
                }
            }

            // Verificar si hay reseñas, si no, agregarlas
            const existingReviews = await Review.countDocuments({ restaurantId: restaurant._id });
            if (existingReviews === 0) {
                const reviews = [
                    {
                        restaurantId: restaurant._id,
                        rating: 5,
                        comment: "Excelente servicio y comida deliciosa. Muy recomendado.",
                        userName: "María Pérez"
                    },
                    {
                        restaurantId: restaurant._id,
                        rating: 4,
                        comment: "Buen ambiente, aunque la comida tardó un poco.",
                        userName: "Carlos G."
                    }
                ];
                await Review.insertMany(reviews);
                console.log("🌱 Reseñas por defecto añadidas al restaurante existente.");
            }

            // Verificar si hay mesas, si no, agregarlas
            const existingTables = await Table.countDocuments({ restaurantId: restaurant._id });
            if (existingTables === 0) {
                const tables = [
                    {
                        tableName: "Mesa 1",
                        tableCapacity: 2,
                        restaurantId: restaurant._id,
                        tableActive: true
                    },
                    {
                        tableName: "Mesa 2",
                        tableCapacity: 4,
                        restaurantId: restaurant._id,
                        tableActive: true
                    },
                    {
                        tableName: "Mesa 3",
                        tableCapacity: 4,
                        restaurantId: restaurant._id,
                        tableActive: true
                    },
                    {
                        tableName: "Mesa 4",
                        tableCapacity: 6,
                        restaurantId: restaurant._id,
                        tableActive: true
                    },
                    {
                        tableName: "Mesa 5",
                        tableCapacity: 8,
                        restaurantId: restaurant._id,
                        tableActive: true
                    }
                ];
                await Table.insertMany(tables);
                console.log("🌱 Mesas por defecto añadidas al restaurante existente.");
            }
        }

        // Segundo restaurante
        let restaurant2 = await Restaurant.findOne({ restaurantEmail: "contacto@bellanapoli.local" });
        if (!restaurant2) {
            restaurant2 = await Restaurant.create({
                restaurantName: "Pizzería Bella Napoli",
                restaurantAddress: "Piazza Roma 45",
                restaurantPhone: "87654321",
                restaurantEmail: "contacto@bellanapoli.local",
                openingHours: "12:00",
                closingHours: "23:00",
                restaurantActive: true,
                restaurantPhoto: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80",
                adminId: null
            });
            console.log("🌱 Segundo restaurante (Pizzería) creado exitosamente.");

            const menus2 = [
                {
                    menuName: "Pizza Margarita",
                    menuDescription: "Masa artesanal, salsa de tomate, mozzarella fresca y albahaca.",
                    menuPrice: 120.00,
                    menuCategory: "PLATO_FUERTE",
                    menuPhoto: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=800&q=80",
                    restaurantId: restaurant2._id
                },
                {
                    menuName: "Focaccia de Ajo",
                    menuDescription: "Pan italiano con aceite de oliva, ajo y romero.",
                    menuPrice: 40.00,
                    menuCategory: "ENTRADA",
                    menuPhoto: "https://images.unsplash.com/photo-1596450514735-71775f0a2cde?auto=format&fit=crop&w=800&q=80",
                    restaurantId: restaurant2._id
                },
                {
                    menuName: "Tiramisú Clásico",
                    menuDescription: "Postre de café, mascarpone y cacao.",
                    menuPrice: 50.00,
                    menuCategory: "POSTRE",
                    menuPhoto: "https://images.unsplash.com/photo-1571115177098-24ec42ed204d?auto=format&fit=crop&w=800&q=80",
                    restaurantId: restaurant2._id
                },
                {
                    menuName: "Vino Tinto de la Casa",
                    menuDescription: "Copa de vino tinto italiano.",
                    menuPrice: 35.00,
                    menuCategory: "BEBIDA",
                    menuPhoto: "https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?auto=format&fit=crop&w=800&q=80",
                    restaurantId: restaurant2._id
                }
            ];
            const insertedMenus2 = await Menu.insertMany(menus2);

            const inventories2 = insertedMenus2.map(m => ({
                menuId: m._id,
                restaurantId: m.restaurantId,
                quantity: 100
            }));
            await Inventory.insertMany(inventories2);

            const promotions2 = [
                {
                    restaurantId: restaurant2._id,
                    title: "Martes de Pizza",
                    description: "2x1 en pizzas Margaritas todos los martes.",
                    couponCode: "PIZZAMARTES",
                    discountPercentage: 50,
                    startDate: new Date(),
                    endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
                    isApproved: true,
                    isActive: true
                }
            ];
            await Promotion.insertMany(promotions2);

            const reviews2 = [
                {
                    restaurantId: restaurant2._id,
                    rating: 5,
                    comment: "La mejor pizza que he probado en la ciudad. La masa es espectacular.",
                    userName: "Juan D."
                },
                {
                    restaurantId: restaurant2._id,
                    rating: 5,
                    comment: "Tiramisú increíble. Volveremos pronto.",
                    userName: "Laura Gómez"
                }
            ];
            await Review.insertMany(reviews2);
            console.log("🌱 Menús, promociones y reseñas del segundo restaurante creados exitosamente.");

            // Crear mesas para la pizzería
            const tables2 = [
                {
                    tableName: "Mesa A",
                    tableCapacity: 2,
                    restaurantId: restaurant2._id,
                    tableActive: true
                },
                {
                    tableName: "Mesa B",
                    tableCapacity: 4,
                    restaurantId: restaurant2._id,
                    tableActive: true
                },
                {
                    tableName: "Mesa C",
                    tableCapacity: 6,
                    restaurantId: restaurant2._id,
                    tableActive: true
                },
                {
                    tableName: "Mesa D",
                    tableCapacity: 8,
                    restaurantId: restaurant2._id,
                    tableActive: true
                }
            ];
            await Table.insertMany(tables2);
            console.log("🌱 Mesas para la pizzería creadas exitosamente.");
        }
    } catch (error) {
        console.error("❌ Error al poblar datos por defecto:", error);
    }
};
