const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const { isAdmin } = require("../middleware/admin");
const {
  createCampaign,
  getCampaigns,
  getCampaignById
} = require("../controllers/campaignController");

// All routes require authentication
router.use(protect);

// Routes that require admin permissions
router.post("/", isAdmin, createCampaign);
router.get("/", isAdmin, getCampaigns);
router.get("/:id", isAdmin, getCampaignById);

module.exports = router;
