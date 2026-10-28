// Run: node seedSuperadmin.js
// Creates (or resets) the demo Super Admin account:
//   email:    superadmin@demo.com
//   password: 123456
// Change the password after first login in production.
require('dotenv').config()
const mongoose = require('mongoose')
const User     = require('./models/User')

const EMAIL    = 'superadmin@demo.com'
const PASSWORD = '123456'
const NAME     = 'Super Admin'

mongoose.connect(process.env.MONGO_URI).then(async () => {
  let user = await User.findOne({ email: EMAIL }).select('+password')
  if (user) {
    user.role = 'superadmin'
    user.permissions = []
    user.password = PASSWORD          // hashed by the User model's pre-save hook
    await user.save()
    console.log(`[OK] Existing account ${EMAIL} is now Super Admin (password reset)`)
  } else {
    await User.create({ name: NAME, email: EMAIL, password: PASSWORD, role: 'superadmin' })
    console.log(`[OK] Super Admin created: ${EMAIL} / ${PASSWORD}`)
  }
  process.exit(0)
}).catch(err => { console.error(err.message); process.exit(1) })
