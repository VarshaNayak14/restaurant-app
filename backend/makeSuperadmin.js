// Run: node makeSuperadmin.js you@example.com
// Makes an existing account (register on the website first) a Super Admin.
require('dotenv').config()
const mongoose = require('mongoose')
const User     = require('./models/User')

const email = String(process.argv[2] || '').trim().toLowerCase()
if (!email) { console.log('Usage: node makeSuperadmin.js <email>'); process.exit(1) }

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const user = await User.findOneAndUpdate({ email }, { $set: { role: 'superadmin', permissions: [] } }, { new: true })
  if (!user) console.log(`[FAIL] No account found for ${email}. Register on the website first.`)
  else console.log(`[OK] ${user.name} <${user.email}> is now a Super Admin`)
  process.exit(0)
}).catch(err => { console.error(err.message); process.exit(1) })
