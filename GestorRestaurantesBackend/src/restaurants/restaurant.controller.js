import Restaurant from "./restaurant.model.js";
import mongoose from "mongoose";
import { v2 as cloudinary } from 'cloudinary';

export const createRestaurant = async (req, res) => {
    try {
        const restaurantData = req.body;
        
        if (req.file) {
            restaurantData.restaurantPhoto = req.file.path;
        }

        const restaurant = new Restaurant(restaurantData);
        await restaurant.save();

        res.status(201).json({
            success: true,
            message: "Restaurant created successfully",
            data: restaurant
        });
        
    } catch (error) {
        if (req.file) {
            try {
                await cloudinary.uploader.destroy(req.file.filename);
            } catch (err) {
                console.error("Error cleaning up image:", err);
            }
        }
        res.status(400).json({
            success: false,
            message: "Error creating restaurant",
            error: error.message
        });
    }
};

export const getRestaurants = async (req, res) => {
    try {
        let { page = 1, limit = 10, restaurantActive = true } = req.query;

        page = parseInt(page);
        limit = parseInt(limit);
        restaurantActive = (restaurantActive === "false") ? false : true;

        const filter = { restaurantActive };

        const restaurants = await Restaurant.find(filter)
            .limit(limit)
            .skip((page - 1) * limit)
            .sort({ createdAt: -1 });

        const total = await Restaurant.countDocuments(filter);

        res.status(200).json({
            success: true,
            data: restaurants,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                totalRecords: total,
                limit
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching restaurants",
            error: error.message
        });
    }
};

export const getRestaurantById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "ID de restaurante no válido"
            });
        }

        const restaurant = await Restaurant.findById(id);

        if (!restaurant) {
            return res.status(404).json({
                success: false,
                message: "Restaurante no encontrado"
            });
        }

        return res.status(200).json({
            success: true,
            data: restaurant
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error al obtener el restaurante",
            error: error.message
        });
    }
};

export const updateRestaurant = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "ID de restaurante no válido"
            });
        }

        const updatedRestaurant = await Restaurant.findByIdAndUpdate(id, req.body, {
            new: true,
            runValidators: true
        });

        if (!updatedRestaurant) {
            return res.status(404).json({
                success: false,
                message: "Restaurante no encontrado"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Restaurante actualizado exitosamente",
            data: updatedRestaurant
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: "Error al actualizar el restaurante",
            error: error.message
        });
    }
};

export const deleteRestaurant = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "ID de restaurante no válido"
            });
        }

        const deletedRestaurant = await Restaurant.findByIdAndUpdate(
            id,
            { restaurantActive: false },
            { new: true }
        );

        if (!deletedRestaurant) {
            return res.status(404).json({
                success: false,
                message: "Restaurante no encontrado"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Restaurante desactivado exitosamente",
            data: deletedRestaurant
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error al eliminar el restaurante",
            error: error.message
        });
    }
};
