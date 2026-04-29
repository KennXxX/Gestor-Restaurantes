"use strict";

import Menu from "./menu.model.js";
import { v2 as cloudinary } from 'cloudinary';

export const createMenu = async (req, res) => {
  try {
    const menuData = { ...(req.body || {}) };
    if (req.file) {
      menuData.menuPhoto = req.file.path;
    }

    const menu = new Menu(menuData);
    await menu.save();

    return res.status(201).json({
      success: true,
      menu
    });

  } catch (error) {
    if (req.file) {
      try {
        await cloudinary.uploader.destroy(req.file.filename);
      } catch (err) {
        console.error("Error cleaning up image:", err);
      }
    }
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getMenus = async (_req, res) => {
  try {
    const menus = await Menu.find();

    return res.json({
      success: true,
      menus
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getMenuById = async (req, res) => {
  try {
    const menu = await Menu.findById(req.params.id);

    if (!menu) {
      return res.status(404).json({
        success: false,
        message: "Menu not found"
      });
    }

    return res.json({
      success: true,
      menu
    });

  } catch (error) {
    if (req.file) {
      try {
        await cloudinary.uploader.destroy(req.file.filename);
      } catch (err) {
        console.error("Error cleaning up image:", err);
      }
    }
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const updateMenu = async (req, res) => {
  try {
    const updateData = { ...(req.body || {}) };
    if (req.file) {
      updateData.menuPhoto = req.file.path;
    }

    const menu = await Menu.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!menu) {
      return res.status(404).json({
        success: false,
        message: "Menu not found"
      });
    }

    return res.json({
      success: true,
      menu
    });

  } catch (error) {
    if (req.file) {
      try {
        await cloudinary.uploader.destroy(req.file.filename);
      } catch (err) {
        console.error("Error cleaning up image:", err);
      }
    }
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const deleteMenu = async (req, res) => {
  try {
    const menu = await Menu.findByIdAndDelete(req.params.id);

    if (!menu) {
      return res.status(404).json({
        success: false,
        message: "Menu not found"
      });
    }

    return res.json({
      success: true,
      message: "Menu deleted successfully"
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
