"use strict";

import { Router } from "express";
import {
  createRestaurant,
  getRestaurants,
  getRestaurantById,
  updateRestaurant,
  deleteRestaurant
} from "./restaurant.controller.js";
import { uploadFieldImage } from "../../middlewares/file-uploader.js";
import { createRestaurantValidator, updateRestaurantValidator } from "../../middlewares/validateRestaurants.js";

const router = Router();
  import { validateJWT, isAdmin } from "../../middlewares/validate-JWT.js";

/**
 * @route   POST /gestorRestaurantes/api/v1/restaurants/create
 * @desc    Crear restaurante
 */
  router.post("/create", validateJWT, isAdmin, uploadFieldImage.single('restaurantPhoto'), createRestaurantValidator, createRestaurant);

/**
 * @route   GET /gestorRestaurantes/api/v1/restaurants
 * @desc    Obtener todos los restaurantes
 */
router.get("/", getRestaurants);

/**
 * @route   GET /gestorRestaurantes/api/v1/restaurants/:id
 * @desc    Obtener restaurante por ID
 */
router.get("/:id", getRestaurantById);

/**
 * @route   PUT /gestorRestaurantes/api/v1/restaurants/:id
 * @desc    Actualizar restaurante
 */
  router.put("/:id", validateJWT, isAdmin, updateRestaurantValidator, updateRestaurant);

/**
 * @route   DELETE /gestorRestaurantes/api/v1/restaurants/:id
 * @desc    Eliminar restaurante (soft delete recomendado)
 */
  router.delete("/:id", validateJWT, isAdmin, deleteRestaurant);

export default router;
