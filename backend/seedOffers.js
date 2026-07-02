require('dotenv').config()
const mongoose = require('mongoose')
const Dish = require('./models/Dish')

/*
  34 dishes — kuch me "discount" field hai (offer chalega), kuch me nahi
  (discount field hi missing hai to woh dish normal price pe rahegi, koi
  offer badge nahi dikhega).

  discount = flat ₹ amount jo price se minus hoga
  e.g. price: 299, discount: 100  →  selling price ₹199 dikhega
*/

const dishes = [

  // ── Starters ────────────────────────────────────────────────────────────

  {
    name: 'Paneer Tikka',
    price: 269,
    discount: 70,          // ₹269 → ₹199
    image: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=600&h=420&fit=crop&q=85',
    cat: 'Starters',
    tag: 'Veg',
    spice: 2,
    desc: 'Smoky cottage cheese cubes marinated in yogurt & spices, grilled to perfection in a clay tandoor with bell peppers and onions.',
    bestseller: true,
  },
  {
    name: 'Chicken Tikka',
    price: 299,
    image: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=600&h=420&fit=crop&q=85',
    cat: 'Starters',
    tag: 'Non-Veg',
    spice: 3,
    desc: 'Juicy chicken pieces marinated overnight in spiced yogurt, skewered and chargrilled in a traditional tandoor for smoky perfection.',
    bestseller: false,
  },
  {
    name: 'Samosa (2 pcs)',
    price: 59,
    discount: 10,          // ₹59 → ₹49
    image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&h=420&fit=crop&q=85',
    cat: 'Starters',
    tag: 'Veg',
    spice: 2,
    desc: 'Crispy golden pastry cones stuffed with spiced mashed potatoes and green peas, served hot with mint-coriander and tamarind chutneys.',
    bestseller: false,
  },
  {
    name: 'Seekh Kebab',
    price: 279,
    image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=600&h=420&fit=crop&q=85',
    cat: 'Starters',
    tag: 'Non-Veg',
    spice: 3,
    desc: 'Minced lamb mixed with fresh herbs, ginger, garlic and aromatic spices, shaped on skewers and grilled over open flame.',
    bestseller: false,
  },
  {
    name: 'Pav Bhaji',
    price: 149,
    discount: 30,          // ₹149 → ₹119
    image: 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=600&h=420&fit=crop&q=85',
    cat: 'Starters',
    tag: 'Veg',
    spice: 2,
    desc: 'Mumbai street food icon — a thick spiced vegetable mash cooked on a tawa, served with buttery toasted pav buns and a squeeze of lemon.',
    bestseller: true,
  },
  {
    name: 'Dahi Puri',
    price: 109,
    image: 'https://images.unsplash.com/photo-1630851840633-f96999247032?w=600&h=420&fit=crop&q=85',
    cat: 'Starters',
    tag: 'Veg',
    spice: 2,
    desc: 'Crisp semolina shells filled with spiced potato and sprouts, drizzled with chilled sweetened yogurt, tamarind chutney and sev.',
    bestseller: false,
  },
  {
    name: 'Fish Amritsari',
    price: 319,
    discount: 50,          // ₹319 → ₹269
    image: 'https://images.unsplash.com/photo-1580822184713-fc5400e7fe10?w=600&h=420&fit=crop&q=85',
    cat: 'Starters',
    tag: 'Non-Veg',
    spice: 3,
    desc: 'Thick fish fillets dipped in an ajwain-spiced gram flour batter and fried golden — a Punjabi classic best enjoyed with mint chutney.',
    bestseller: false,
  },
  {
    name: 'Tawa Fish Fry',
    price: 349,
    image: 'https://images.unsplash.com/photo-1519984388953-d2406bc725e1?w=600&h=420&fit=crop&q=85',
    cat: 'Starters',
    tag: 'Non-Veg',
    spice: 4,
    desc: 'Whole pomfret marinated in red chilli paste, turmeric and lemon juice, pan-seared on a sizzling iron tawa with onions and curry leaves.',
    bestseller: false,
  },

  // ── Main Course ─────────────────────────────────────────────────────────

  {
    name: 'Butter Chicken',
    price: 299,
    discount: 100,         // ₹299 → ₹199
    image: 'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=600&h=420&fit=crop&q=85',
    cat: 'Main Course',
    tag: 'Non-Veg',
    spice: 2,
    desc: 'Tender grilled chicken simmered in a velvety tomato-cream sauce enriched with butter, fenugreek leaves and warming spices. A timeless classic.',
    bestseller: true,
  },
  {
    name: 'Dal Makhani',
    price: 229,
    discount: 40,          // ₹229 → ₹189
    image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&h=420&fit=crop&q=85',
    cat: 'Main Course',
    tag: 'Veg',
    spice: 1,
    desc: 'Whole black lentils and kidney beans slow-cooked overnight on a gentle flame with tomatoes, butter and cream — rich, silky and deeply satisfying.',
    bestseller: true,
  },
  {
    name: 'Palak Paneer',
    price: 239,
    image: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=600&h=420&fit=crop&q=85',
    cat: 'Main Course',
    tag: 'Veg',
    spice: 2,
    desc: 'Fresh cottage cheese cubes nestled in a lush, velvety spinach gravy seasoned with cumin, garam masala and a touch of cream.',
    bestseller: false,
  },
  {
    name: 'Shahi Paneer',
    price: 269,
    image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=600&h=420&fit=crop&q=85',
    cat: 'Main Course',
    tag: 'Veg',
    spice: 1,
    desc: 'Royal cottage cheese in a rich Mughal-era gravy of cashews, cream, saffron and aromatic spices — mildly spiced and absolutely indulgent.',
    bestseller: false,
  },
  {
    name: 'Rogan Josh',
    price: 349,
    discount: 60,          // ₹349 → ₹289
    image: 'https://images.unsplash.com/photo-1545247181-516773cae754?w=600&h=420&fit=crop&q=85',
    cat: 'Main Course',
    tag: 'Non-Veg',
    spice: 4,
    desc: 'Slow-braised Kashmiri lamb in a deep-red aromatic sauce of Kashmiri chillies, whole spices and yogurt — bold, warming and intensely flavoured.',
    bestseller: false,
  },
  {
    name: 'Kadai Chicken',
    price: 329,
    image: 'https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=600&h=420&fit=crop&q=85',
    cat: 'Main Course',
    tag: 'Non-Veg',
    spice: 3,
    desc: 'Bone-in chicken cooked in a wok with julienned bell peppers, tomatoes and a freshly ground kadai masala of coriander and red chillies.',
    bestseller: false,
  },
  {
    name: 'Chicken Korma',
    price: 319,
    image: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=600&h=420&fit=crop&q=85',
    cat: 'Main Course',
    tag: 'Non-Veg',
    spice: 1,
    desc: 'Tender chicken braised in a luxurious sauce of cashew paste, whole spices, rose water and saffron — mild, creamy and beautifully fragrant.',
    bestseller: false,
  },
  {
    name: 'Chole Bhature',
    price: 179,
    discount: 30,          // ₹179 → ₹149
    image: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=600&h=420&fit=crop&q=85',
    cat: 'Main Course',
    tag: 'Veg',
    spice: 3,
    desc: 'Spicy Punjabi chickpea curry paired with pillowy deep-fried bhature — a beloved North Indian combo best enjoyed with sliced onions and pickle.',
    bestseller: false,
  },
  {
    name: 'Prawn Masala',
    price: 389,
    image: 'https://images.unsplash.com/photo-1625944525533-473f1a3d54e7?w=600&h=420&fit=crop&q=85',
    cat: 'Main Course',
    tag: 'Non-Veg',
    spice: 4,
    desc: 'Plump tiger prawns tossed in a fiery coastal masala of coconut milk, curry leaves, mustard seeds and Konkan spices.',
    bestseller: false,
  },
  {
    name: 'Mutton Keema',
    price: 369,
    discount: 70,          // ₹369 → ₹299
    image: 'https://images.unsplash.com/photo-1574894709920-11b28e7367e3?w=600&h=420&fit=crop&q=85',
    cat: 'Main Course',
    tag: 'Non-Veg',
    spice: 4,
    desc: 'Spiced minced mutton cooked with green peas, tomatoes, ginger-garlic paste and whole garam masala until dry and intensely flavoured.',
    bestseller: false,
  },
  {
    name: 'Egg Curry',
    price: 199,
    image: 'https://images.unsplash.com/photo-1482049489765-5571db5b4653?w=600&h=420&fit=crop&q=85',
    cat: 'Main Course',
    tag: 'Non-Veg',
    spice: 3,
    desc: 'Hard-boiled eggs simmered in a tangy onion-tomato masala with mustard seeds, curry leaves and coastal spices — comforting and flavourful.',
    bestseller: false,
  },

  // ── Rice & Biryani ──────────────────────────────────────────────────────

  {
    name: 'Biryani Royale',
    price: 349,
    discount: 80,          // ₹349 → ₹269
    image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&h=420&fit=crop&q=85',
    cat: 'Rice & Biryani',
    tag: 'Non-Veg',
    spice: 3,
    desc: 'Fragrant long-grain basmati layered with succulent marinated meat, saffron milk, caramelised onions and whole spices — sealed and dum-cooked.',
    bestseller: true,
  },
  {
    name: 'Veg Dum Biryani',
    price: 269,
    discount: 40,          // ₹269 → ₹229
    image: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=600&h=420&fit=crop&q=85',
    cat: 'Rice & Biryani',
    tag: 'Veg',
    spice: 2,
    desc: 'Aromatic basmati rice slow-cooked with seasonal vegetables, saffron, mint, fried onions and whole spices in a sealed handi.',
    bestseller: false,
  },
  {
    name: 'Jeera Rice',
    price: 129,
    image: 'https://images.unsplash.com/photo-1516714435131-44d6b64dc6a2?w=600&h=420&fit=crop&q=85',
    cat: 'Rice & Biryani',
    tag: 'Veg',
    spice: 1,
    desc: 'Fluffy basmati rice tempered with cumin seeds, bay leaf, cloves and pure desi ghee — a simple, fragrant accompaniment to any curry.',
    bestseller: false,
  },

  // ── Breads ──────────────────────────────────────────────────────────────

  {
    name: 'Garlic Naan',
    price: 65,
    image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&h=420&fit=crop&q=85',
    cat: 'Breads',
    tag: 'Veg',
    spice: 0,
    desc: 'Soft, leavened flatbread slathered with roasted garlic butter and fresh coriander, baked directly on the hot walls of a clay tandoor.',
    bestseller: false,
  },
  {
    name: 'Tandoori Roti',
    price: 39,
    image: 'https://images.unsplash.com/photo-1586444248902-2f64eddc13df?w=600&h=420&fit=crop&q=85',
    cat: 'Breads',
    tag: 'Veg',
    spice: 0,
    desc: 'Whole-wheat unleavened flatbread patted by hand and baked on the walls of a traditional clay tandoor — light, wholesome and perfectly charred.',
    bestseller: false,
  },
  {
    name: 'Aloo Paratha',
    price: 89,
    discount: 15,          // ₹89 → ₹74
    image: 'https://images.unsplash.com/photo-1604152135912-04a022e23696?w=600&h=420&fit=crop&q=85',
    cat: 'Breads',
    tag: 'Veg',
    spice: 2,
    desc: 'Flaky whole-wheat flatbread stuffed with spiced mashed potato, cooked on a tawa with generous butter — served with curd and pickle.',
    bestseller: false,
  },
  {
    name: 'Methi Thepla',
    price: 79,
    image: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=600&h=420&fit=crop&q=85',
    cat: 'Breads',
    tag: 'Veg',
    spice: 2,
    desc: 'Gujarati flatbread made with fresh fenugreek leaves, yogurt, turmeric and mild spices — soft, slightly tangy and packed with flavour.',
    bestseller: false,
  },

  // ── Desserts ────────────────────────────────────────────────────────────

  {
    name: 'Gulab Jamun',
    price: 99,
    discount: 20,          // ₹99 → ₹79
    image: 'https://images.unsplash.com/photo-1666388895498-ddd3369f1b8f?w=600&h=420&fit=crop&q=85',
    cat: 'Desserts',
    tag: 'Veg',
    spice: 0,
    desc: 'Melt-in-the-mouth milk-solid dumplings fried golden and soaked in warm rose-cardamom sugar syrup — India\'s most beloved sweet.',
    bestseller: true,
  },
  {
    name: 'Rasmalai',
    price: 129,
    discount: 30,          // ₹129 → ₹99
    image: 'https://images.unsplash.com/photo-1589249840154-c57de8dbcbff?w=600&h=420&fit=crop&q=85',
    cat: 'Desserts',
    tag: 'Veg',
    spice: 0,
    desc: 'Delicate chenna patties soaked in chilled, sweetened saffron milk, garnished with crushed pistachios and dried rose petals.',
    bestseller: true,
  },
  {
    name: 'Kulfi',
    price: 119,
    image: 'https://images.unsplash.com/photo-1488900128323-21503983a07e?w=600&h=420&fit=crop&q=85',
    cat: 'Desserts',
    tag: 'Veg',
    spice: 0,
    desc: 'Traditional Indian ice cream made by slowly reducing full-fat milk with sugar, cardamom, saffron and crushed pistachios — dense and intensely creamy.',
    bestseller: false,
  },
  {
    name: 'Kheer',
    price: 109,
    image: 'https://images.unsplash.com/photo-1568571780765-9276ac8b75a2?w=600&h=420&fit=crop&q=85',
    cat: 'Desserts',
    tag: 'Veg',
    spice: 0,
    desc: 'Creamy rice pudding slow-cooked in full-fat milk with sugar, cardamom pods, saffron strands and garnished with almonds and dry fruits.',
    bestseller: false,
  },

  // ── Drinks ──────────────────────────────────────────────────────────────

  {
    name: 'Mango Lassi',
    price: 99,
    discount: 15,          // ₹99 → ₹84
    image: 'https://images.unsplash.com/photo-1553361371-9b22f78e8b1d?w=600&h=420&fit=crop&q=85',
    cat: 'Drinks',
    tag: 'Veg',
    spice: 0,
    desc: 'Thick, frothy yogurt blended with ripe Alphonso mango pulp, a touch of sugar and cardamom — chilled and served with a sprinkle of saffron.',
    bestseller: false,
  },
  {
    name: 'Masala Chai',
    price: 59,
    image: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=600&h=420&fit=crop&q=85',
    cat: 'Drinks',
    tag: 'Veg',
    spice: 1,
    desc: 'Strong Assam tea brewed with fresh ginger, crushed cardamom, cinnamon, cloves and whole milk — aromatic, warming and deeply comforting.',
    bestseller: false,
  },
  {
    name: 'Lassi (Sweet)',
    price: 79,
    image: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=600&h=420&fit=crop&q=85',
    cat: 'Drinks',
    tag: 'Veg',
    spice: 0,
    desc: 'Classic Punjabi yogurt drink churned with sugar and a hint of cardamom — thick, chilled and incredibly refreshing on a warm day.',
    bestseller: false,
  },
  {
    name: 'Cold Coffee',
    price: 119,
    discount: 20,          // ₹119 → ₹99
    image: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=600&h=420&fit=crop&q=85',
    cat: 'Drinks',
    tag: 'Veg',
    spice: 0,
    desc: 'Rich espresso blended with chilled full-cream milk, sugar and crushed ice — topped with a generous scoop of vanilla ice cream.',
    bestseller: false,
  },
]

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI)
    console.log('[OK] MongoDB connected')

    // Purani dishes delete karo
    const deleted = await Dish.deleteMany({})
    console.log(`[OK] Cleared ${deleted.deletedCount} existing dishes`)

    // Nayi dishes insert karo
    const inserted = await Dish.insertMany(dishes)
    console.log(`[OK] Seeded ${inserted.length} dishes successfully`)

    // Summary print karo
    const cats = {}
    inserted.forEach(d => { cats[d.cat] = (cats[d.cat] || 0) + 1 })
    console.log('\n── Category breakdown ──')
    Object.entries(cats).forEach(([cat, count]) => console.log(`   ${cat}: ${count} dishes`))

    const withOffer = inserted.filter(d => d.discount > 0)
    console.log(`\n   Bestsellers: ${inserted.filter(d => d.bestseller).length}`)
    console.log(`   Dishes with an active offer: ${withOffer.length}`)
    console.log(`   Dishes with no offer: ${inserted.length - withOffer.length}`)
    console.log('────────────────────────\n')

  } catch (err) {
    console.error('[FAIL]', err.message)
  } finally {
    await mongoose.disconnect()
    console.log('[OK] MongoDB disconnected')
  }
}

seed()
