// Assignemnt 3
// This program displays products for an online store and displays a receipt when the custerm checksout

// Name: Josh Lanesmith
// Created: 2023-07-21

// import the dependencies
const express = require('express')
const path = require('path')
var myApp = express()
const {check, validationResult} = require('express-validator')
myApp.use(express.urlencoded({extended:false}))

// set up views and public folders
myApp.set('views', path.join(__dirname, 'views'))
myApp.use(express.static(__dirname +'/public'))
myApp.set('view engine', 'ejs')

// Define store products
const products = [
  { name: 'Scary Masks', price: 5, id: 'prod0' },
  { name: 'Voldemort t-shirt', price: 9, id: 'prod1' },
  { name: 'Cursed Necklace', price: 20, id: 'prod2' }
]

// Define object of provincial sales tax rates
const salesTaxRates = {
  'AB': 0.05, // Alberta
  'BC': 0.07, // British Columbia
  'MB': 0.08, // Manitoba
  'NB': 0.15, // New Brunswick
  'NL': 0.15, // Newfoundland and Labrador
  'NS': 0.15, // Nova Scotia
  'NT': 0.05, // Northwest Territories
  'NU': 0.05, // Nunavut
  'ON': 0.13, // Ontario
  'PE': 0.15, // Prince Edward Island
  'QC': 0.09975, // Quebec
  'SK': 0.06, // Saskatchewan
  'YT': 0.05, // Yukon
};

// Render store page
myApp.get('/', function(req, res){
  res.render('store', { products }) // no need to add .ejs to the file name
})

// Custom validation function to check for a valid product quantity
const validateProductQuantity = (product) => {
  return check(`${product.id}`, `Invalid quantity for ${product.name}`)
    .optional({checkFalsy: true})
    .isInt({ min: 0 })
};

// Combine all validation functions for each product
const validateProductQuantities = products.map(validateProductQuantity);


myApp.post('/', [
  // Validate all user input fields
  check('name', 'Name required').trim().notEmpty(),
  check('address', 'Address required').trim().notEmpty(),
  check('city', 'City required').trim().notEmpty(),
  check('province', 'Valid province code required').trim().toUpperCase().custom((value) => {
    if (value in salesTaxRates) {
      return true;
    }
    return false}),
  check('phone', 'Invalid phone number entered').trim().optional({checkFalsy: true}).isMobilePhone('en-CA'),
  check('email', 'Invalid email entered').trim().optional({checkFalsy: true}).isEmail(),
  ...validateProductQuantities
], function(req, res){
  const errors = validationResult(req)

  // Save user input values
  var prodFieldValues = {}
  for (var product of products){
    prodFieldValues[product.id] = req.body[product.id]
  }

  var customerFieldValues = {
    name: req.body.name,
    address: req.body.address,
    city: req.body.city,
    province: req.body.province,
    phone: req.body.phone,
    email: req.body.email
  }

  //Combine all user input fields into one object to pass through when rendering
  var fieldValues = {
    ...customerFieldValues,
    ...prodFieldValues
  }

  if(!errors.isEmpty()){
    // If errors then render store page with error messages and current user input values
    res.render('store', { products, errors : errors.array(), fieldValues })
  }
  else {

    // Calculate subtotal and isolate product details for products with quantities entered
    var subtotal = 0
    var receiptProductData = []

    for (var product of products){
      if (parseFloat(prodFieldValues[product.id]) > 0 ){
        var price = parseFloat(prodFieldValues[product.id]) * product.price

        subtotal += price

        var productData = {
          item: product.name,
          unitPrice: product.price.toFixed(2),
          qty: prodFieldValues[product.id],
          price: price.toFixed(2)
        }

        receiptProductData.push(productData)
      }
    }

    if (subtotal < 10) {
      // If subtotal is less than minimum purchase then render store page with message
      let message = 'Miminum purchase allowed is 10 Galleons'
      res.render('store', { products, fieldValues, message})
    }
    else {

      // Isolate Custmer Data that was entered in order to display properly on receipt
      var receiptCustomerData = {}

      for (var key in customerFieldValues) {
        if (customerFieldValues[key] != '' && customerFieldValues[key] != 'undefined'){
          receiptCustomerData[key] = customerFieldValues[key]
        }
      }

      //Calculate tax and total purchase and save into object to pass to front end
      var tax = subtotal * parseFloat(salesTaxRates[customerFieldValues.province])
      var total = subtotal + tax

      var receiptTotals = {
        subtotal: subtotal.toFixed(2),
        tax: tax.toFixed(2),
        total: total.toFixed(2)
      }

      // Render store page with with all receipt data 
      res.render('store', { products, fieldValues, receiptCustomerData, receiptProductData, receiptTotals })

    }
  }
})

// Start the server
const port = 8084
myApp.listen(port, function() {
  console.log(`Server is running on port ${port}`)
});