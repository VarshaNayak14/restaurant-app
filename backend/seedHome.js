require('dotenv').config()
const mongoose = require('mongoose')

const Testimonial = require('./models/Testimonial')
const Category    = require('./models/Category')
const Chef        = require('./models/Chef')
const Gallery     = require('./models/Gallery')

const testimonials = [
  { name:'Priya Sharma',  role:'Happy Customer', img:'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&q=80', text:'The Butter Chicken here is unlike anything I have had before. Rich, creamy, and full of warmth. A visit worth every rupee.', stars:5, order:1 },
  { name:'Rahul Mehta',   role:'Food Blogger',   img:'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&q=80', text:'Spice Garden has mastered the art of authentic Indian cuisine. The Biryani Royale is simply extraordinary — fragrant and perfectly spiced.', stars:5, order:2 },
  { name:'Aisha Khan',    role:'Happy Customer', img:'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&q=80', text:'The ambience is stunning and the food even more so. Every dish we ordered arrived hot, fresh, and bursting with flavour.', stars:5, order:3 },
  { name:'Vikram Nair',   role:'Regular Guest',  img:'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&q=80', text:'I have been coming here for over a decade. The Dal Makhani alone is worth the trip — slow-cooked perfection every single time.', stars:5, order:4 },
  { name:'Sneha Patel',   role:'Food Critic',    img:'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&q=80', text:'Rarely does a restaurant manage to balance tradition and presentation so flawlessly. Spice Garden does it effortlessly.', stars:5, order:5 },
  { name:'Arjun Kapoor',  role:'Happy Customer', img:'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop&q=80', text:'The Paneer Tikka is smoky, juicy, and perfectly charred. Paired with their mint chutney — absolutely outstanding.', stars:5, order:6 },
]

const categories = [
  { name:'Salads',       img:'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=200&h=200&fit=crop&q=80',  link:'/menu?cat=Starters',         order:1 },
  { name:'Vegetarian',  img:'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&h=200&fit=crop&q=80',  link:'/menu?tag=Veg',              order:2 },
  { name:'Seafood',     img:'https://images.unsplash.com/photo-1559737558-2f5a35f4523b?w=200&h=200&fit=crop&q=80',  link:'/menu',                      order:3 },
  { name:'Desserts',    img:'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=200&h=200&fit=crop&q=80',  link:'/menu?cat=Desserts',         order:4 },
  { name:'Main Courses',img:'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=200&h=200&fit=crop&q=80',link:'/menu?cat=Main+Course',      order:5 },
  { name:'Cocktails',   img:'https://images.unsplash.com/photo-1551538827-9c037cb4f32a?w=200&h=200&fit=crop&q=80',  link:'/menu?cat=Drinks',           order:6 },
  { name:"Kid's Menu",  img:'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=200&h=200&fit=crop&q=80',link:'/menu',                      order:7 },
  { name:'Biryani',     img:'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=200&h=200&fit=crop&q=80',link:'/menu?cat=Rice+%26+Biryani', order:8 },
]

const chefs = [
  { name:'Arjun Mehta',  role:'Head Chef & Founder', img:'https://images.unsplash.com/photo-1583394293214-0b3a27af5ac1?w=400&h=500&fit=crop&q=85', order:1 },
  { name:'Priya Sharma', role:'Executive Chef',       img:'https://images.unsplash.com/photo-1607631568010-a87245c0daf8?w=400&h=500&fit=crop&q=85', order:2 },
  { name:'Rohan Kapoor', role:'Tandoor Specialist',   img:'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=400&h=500&fit=crop&q=85', order:3 },
]

const gallery = [
  {
    label:'Biryani Royale', order:1,
    src:'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&h=500&fit=crop&q=85',
    related:[
      'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=600&h=400&fit=crop&q=85',
      'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=600&h=400&fit=crop&q=85',
      'https://images.unsplash.com/photo-1548943487-a2e4e43b4853?w=600&h=400&fit=crop&q=85',
      'https://images.unsplash.com/photo-1645177628172-a94c1f96daee?w=600&h=400&fit=crop&q=85',
    ]
  },
  {
    label:'Paneer Tikka', order:2,
    src:'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=500&h=500&fit=crop&q=85',
    related:[
      'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=600&h=400&fit=crop&q=85',
      'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=600&h=400&fit=crop&q=85',
      'https://images.unsplash.com/photo-1631452180539-96aca7d48617?w=600&h=400&fit=crop&q=85',
      'https://images.unsplash.com/photo-1574653853027-5382a3d23a15?w=600&h=400&fit=crop&q=85',
    ]
  },
  {
    label:'Butter Chicken', order:3,
    src:'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=500&h=500&fit=crop&q=85',
    related:[
      'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=600&h=400&fit=crop&q=85',
      'https://images.unsplash.com/photo-1631452180539-96aca7d48617?w=600&h=400&fit=crop&q=85',
      'https://images.unsplash.com/photo-1548943487-a2e4e43b4853?w=600&h=400&fit=crop&q=85',
      'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&h=400&fit=crop&q=85',
    ]
  },
  {
    label:'Gulab Jamun', order:4,
    src:'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=500&h=500&fit=crop&q=85',
    related:[
      'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=600&h=400&fit=crop&q=85',
      'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=600&h=400&fit=crop&q=85',
      'https://images.unsplash.com/photo-1607920592519-bab2a80efd25?w=600&h=400&fit=crop&q=85',
      'https://images.unsplash.com/photo-1516714819001-8ee7a13b71d7?w=600&h=400&fit=crop&q=85',
    ]
  },
  {
    label:'Veg Biryani', order:5,
    src:'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=800&h=500&fit=crop&q=85',
    related:[
      'https://images.unsplash.com/photo-1546833998-877b37c2e5c6?w=600&h=400&fit=crop&q=85',
      'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=600&h=400&fit=crop&q=85',
      'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=600&h=400&fit=crop&q=85',
      'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=600&h=400&fit=crop&q=85',
    ]
  },
  {
    label:'Live Tandoor', order:6,
    src:'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=500&h=500&fit=crop&q=85',
    related:[
      'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&h=400&fit=crop&q=85',
      'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&h=400&fit=crop&q=85',
      'https://images.unsplash.com/photo-1567521464027-f127ff144326?w=600&h=400&fit=crop&q=85',
      'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&h=400&fit=crop&q=85',
    ]
  },
]

async function seed() {
  await mongoose.connect(process.env.MONGO_URI)
  console.log('Connected to MongoDB')

  await Testimonial.deleteMany({})
  await Category.deleteMany({})
  await Chef.deleteMany({})
  await Gallery.deleteMany({})

  await Testimonial.insertMany(testimonials)
  await Category.insertMany(categories)
  await Chef.insertMany(chefs)
  await Gallery.insertMany(gallery)

  console.log('✅ Home seed data inserted: Testimonials, Categories, Chefs, Gallery')
  await mongoose.disconnect()
}

seed().catch(err => { console.error(err); process.exit(1) })