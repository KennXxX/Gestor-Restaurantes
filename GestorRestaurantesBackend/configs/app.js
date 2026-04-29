"use strict";

import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import { dbConnection } from "./db.js";
import { corsOptions } from "./cors-configuration.js";

import restaurantRoutes from "../src/restaurants/restaurant.routes.js";
import menuRoutes from "../src/menus/menu.routes.js";
import tableRoutes from "../src/tables/table.routes.js";
import reservationRoutes from "../src/reservations/reservation.routes.js";
import orderRoutes from "../src/orders/order.routes.js";
import eventRoutes from "../src/events/event.routes.js"
import statisticsRoutes from "../src/statistics/statistics.routes.js"
import promotionRoutes from "../src/promotions/promotion.routes.js"
import reviewRoutes from "../src/reviews/review.routes.js"
import inventoryRoutes from "../src/inventory/inventory.routes.js"
import invoiceRoutes from "../src/invoices/invoice.routes.js"


const app = express();

// 🔹 Middlewares
app.use(helmet());
app.use(cors(corsOptions)); 
app.use(morgan("dev"));
app.use(express.urlencoded({ extended: false, limit: "10mb" }));
app.use(express.json({ limit: "10mb" }));

// 🔹 Health check
app.get("/health", (_req, res) => {
    res.status(200).json({
        ok: true,
        status: "up",
        service: "Gestor de Restaurantes"
    });
});

// 🔹 Rutas
app.use("/gestorRestaurantes/api/v1/restaurants", restaurantRoutes);
app.use("/gestorRestaurantes/api/v1/menus", menuRoutes);
app.use("/gestorRestaurantes/api/v1/tables", tableRoutes);
app.use("/gestorRestaurantes/api/v1/reservations", reservationRoutes);
app.use("/gestorRestaurantes/api/v1/orders", orderRoutes);
app.use("/gestorRestaurantes/api/v1/events", eventRoutes);
app.use("/gestorRestaurantes/api/v1/statistics", statisticsRoutes);
app.use("/gestorRestaurantes/api/v1/promotions", promotionRoutes);
app.use("/gestorRestaurantes/api/v1/reviews", reviewRoutes);
app.use("/gestorRestaurantes/api/v1/inventory", inventoryRoutes);
app.use("/gestorRestaurantes/api/v1/invoices", invoiceRoutes);

// 🔹 404
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "Endpoint not found"
    });
});

export default app;
