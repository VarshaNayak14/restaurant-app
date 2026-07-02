const mongoose = require('mongoose')

/*
  Ek Offer = "Flash Offer" banner jo admin khud schedule karta hai.
  - startAt / endAt  → offer kab se kab tak chalega (exact date + time)
  - items[]          → kaun si dishes is offer me shaamil hain + unpe kitna
                        (₹ flat) discount milega
  - active            → admin ka manual on/off switch (date window ke sath
                        combine hoke decide karta hai ki offer abhi LIVE hai ya nahi)

  Home page aur dish listing isi model se "abhi live" offer nikaal ke
  uska discount dikhate hain — jaise hi endAt nikal jata hai, offer khud
  hat jata hai, kuch manually revert nahi karna padta.
*/

const offerItemSchema = new mongoose.Schema(
  {
    dish: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Dish',
      required: [true, 'Dish is required for an offer item'],
    },
    discount: {
      type: Number,
      required: [true, 'Discount is required for each offer item'],
      min: [1, 'Discount must be greater than 0'],
    },
  },
  { _id: false }
)

const offerSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
      default: 'Flash Offer',
    },
    subtitle: {
      type: String,
      trim: true,
      default: '',
    },
    startAt: {
      type: Date,
      required: [true, 'Offer start date/time is required'],
    },
    endAt: {
      type: Date,
      required: [true, 'Offer end date/time is required'],
    },
    active: {
      type: Boolean,
      default: true,
    },
    items: {
      type: [offerItemSchema],
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length > 0,
        message: 'Select at least one dish for this offer',
      },
    },
  },
  { timestamps: true }
)

offerSchema.pre('validate', function (next) {
  if (this.startAt && this.endAt && this.endAt <= this.startAt) {
    return next(new Error('End date/time must be after start date/time'))
  }
  next()
})

module.exports = mongoose.model('Offer', offerSchema)