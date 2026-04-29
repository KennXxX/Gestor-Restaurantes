"use strict";

import { Router } from "express";
import {
  createMenu,
  deleteMenu,
  getMenuById,
  getMenus,
  updateMenu
} from "./menu.controller.js";
import {
  validateCreateMenu,
  validateMenuId,
  validateUpdateMenu
} from "../../middlewares/validateMenus.js";
import { uploadFieldImage } from "../../middlewares/file-uploader.js"; 
import { validateJWT, isAdmin } from "../../middlewares/validate-JWT.js";

const router = Router();

router.post("/", validateJWT, isAdmin, uploadFieldImage.single("menuPhoto"), validateCreateMenu, createMenu);
router.get("/", getMenus);
router.get("/:id", validateMenuId, getMenuById);
router.put("/:id", validateJWT, isAdmin, validateMenuId, uploadFieldImage.single("menuPhoto"), validateUpdateMenu, updateMenu);
router.delete("/:id", validateJWT, isAdmin, validateMenuId, deleteMenu);

export default router;
