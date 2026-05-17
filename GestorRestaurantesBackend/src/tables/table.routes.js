"use strict";

import { Router } from "express";
import {
	createTable,
	deleteTable,
	getAvailableTables,
	getTableById,
	getTables,
	updateTableAvailability,
	updateTable,
} from "./table.controller.js";
import {
	validateCreateTable,
	validateGetTables,
	validateTableId,
	validateUpdateTable,
} from "../../middlewares/table.middleware.js";
import { uploadFieldImage } from "../../middlewares/file-uploader.js";
import { validateJWT, isAdmin } from "../../middlewares/validate-JWT.js";

const router = Router();

// Accept form-data without files by running multer.none() so req.body is populated
router.post("/", validateJWT, isAdmin, uploadFieldImage.none(), validateCreateTable, createTable);
router.get("/", validateGetTables, getTables);
router.get("/available", validateJWT, isAdmin, getAvailableTables);
router.get("/:id", validateTableId, getTableById);
router.put("/:id", validateJWT, isAdmin, validateTableId, uploadFieldImage.none(), validateUpdateTable, updateTable);
router.patch("/:id/availability", validateJWT, isAdmin, validateTableId, uploadFieldImage.none(), updateTableAvailability);
router.delete("/:id", validateJWT, isAdmin, validateTableId, deleteTable);

export default router;
