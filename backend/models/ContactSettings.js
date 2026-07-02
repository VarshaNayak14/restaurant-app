const mongoose = require('mongoose')

// Single-document settings — always upsert by key "main"
const contactSettingsSchema = new mongoose.Schema(
  {
    key: { type: String, default: 'main', unique: true },

    // Location card
    address:  { type: String, default: '42 Spice Lane, Bandra West' },
    city:     { type: String, default: 'Mumbai, MH 400050' },

    // Phone card
    phone:    { type: String, default: '+91 98765 43210' },
    phone2:   { type: String, default: '' },

    // Email card
    email:    { type: String, default: 'hello@restaurant.com' },
    email2:   { type: String, default: '' },

    // Hours card
    hours:    { type: String, default: 'Mon – Sun: 11am – 11pm' },
    hours2:   { type: String, default: 'Kitchen closes at 10:30pm' },

    // Map section
    mapLabel: { type: String, default: 'Restaurant Location' },
    mapImg:   { type: String, default: 'https://images.unsplash.com/photo-1600891964599-f61ba0e24092?w=600&h=500&fit=crop&q=80' },
    mapEmbed: { type: String, default: '' },   // Google Maps iframe src

    // How to find us text
    mapNearby1: { type: String, default: '' },
    mapNearby2: { type: String, default: '' },
    mapNearby3: { type: String, default: '' },
  },
  { timestamps: true }
)

module.exports = mongoose.model('ContactSettings', contactSettingsSchema)