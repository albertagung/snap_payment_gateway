$(document).ready(() => {
	
	// Loading overlay start
	$.LoadingOverlay('show')

	// Parse address code id into string format (rajaongkir API format)
	parseAddressCode = (provinceId, cityId, subdistrictId) => {
		// Loading overlay start
		$.LoadingOverlay('show')
		return new Promise ((resolve, reject) => {
			// Define parsedProvinceId
			let parsedProvinceId = ''
			// Define parsedCityId
			let parsedCityId = ''
			// Define parsedSubdistrictId
			let parsedSubdistrictId = ''
			// Define url get province
			let urlGetProvince = 'http://localhost:3000/shipping/province'
			// Get province
			axios({
				method: 'get',
				url: urlGetProvince
			})
			.then((responseProvinceRequest) => {
				// Define province
				let province = responseProvinceRequest.data.rajaongkir.results
				// Iterate province data
				province.forEach((dataProvince) => {
					// Check with provinceId, if found then put it into parsedProvinceId
					if (dataProvince.provinece_id === provinceId) {
						// Assign province name into parsed variable
						parsedProvinceId = dataProvince.province
					}
				})
				// Define url get city by province id
				let urlGetCityByProvinceId = `http://localhost:3000/shipping/city/${provinceId}`
				// Get city
				axios({
					method: 'get',
					url: urlGetCityByProvinceId
				})
				.then((responseCityRequest) => {
					// Define cities
					let cities = responseCityRequest.data.rajaongkir.results
					// Iterate cities data
					cities.forEach((dataCities) => {
						// Check with cityId, if found then put it into parsedCityId
						if (dataCities.city_id === cityId) {
							// Assign city name into parsed variable
							parsedCityId = dataCities.city_name
						}
					})
					// Define url get subdistrict by city id
					let urlGetSubdistrictByCityId = `http://localhost:3000/shipping/subdistrict/${cityId}`
					// Get subdistricts
					axios({
						method: 'get',
						url: urlGetSubdistrictByCityId
					})
					.then((responseSubdistrictRequest) => {
						// Define subdistricts
						let subdistricts = responseSubdistrictRequest.data.rajaongkir.results
						// Iterate subdistricts data
						subdistricts.forEach((dataSubdistricts) => {
							// Check with subdistrictId, if found then put it into parsedSubdistrictId
							if (dataSubdistricts.subdistrict_id === subdistrictId) {
								// Assign subdistrict name into parsed variable
								parsedSubdistrictId = dataSubdistricts.subdistrict_name
							}
						})
						// Loading overlay stop
						$.LoadingOverlay('hide')
						// Resolve all results
						resolve({
							provinceName: parsedProvinceId,
							cityName: parsedCityId,
							subdistrictName: parsedSubdistrictId
						})
					})
				})
			})
		})
	}

	// Get value from query
	getQueryValue = () => {
    let arrQuery = [], hash;
    let hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
    for(let i = 0; i < hashes.length; i++)
    {
      hash = hashes[i].split('=');
      arrQuery.push(hash[0]);
      arrQuery[hash[0]] = hash[1];
    }
    // Return object query, but have to called per key. ex: getQueryValue().name
    return arrQuery;
	}

	// Get data products id from server (promise)
	getProductsId = (userId) => {
		return new Promise ((resolve, reject) => {
			// Define url get user by id
			const urlGetUserById = `http://localhost:3000/users/${userId}`
			// Get the data user
			axios({
				method: 'get',
				url: urlGetUserById
			})
			.then((response) => {
				// Define dataUser
				let dataUser = response.data[0]
				// Define arrProducts
				let arrProductsId = []
				// Define shipping cost
				let shippingCost = 0
				// Iterate through user transaction histories
				dataUser.transactionHistories.forEach((dataTransactions) => {
					// Define transaction id from client
					let transactionIdFromClient = getQueryValue().transactionId
					// Check if transaction id is the same with the one in DB
					if (transactionIdFromClient === dataTransactions._id) {
						// Assign shipping cost
						shippingCost = parseInt(dataTransactions.shippingCost)
						// iterate through transactions products
						dataTransactions.products.forEach((dataProductsTransaction) => {
							// Push product id
							arrProductsId.push({
								productId: dataProductsTransaction.productId,
								buyingQty: dataProductsTransaction.buyingQty
							})
						})
					}
				})
				// Resolve in object to send differents data
				resolve({
					arrProductsId: arrProductsId,
					shippingCost: shippingCost
				})
			})
		})
	}

	// Get products
	getProducts = () => {
		// Loading overlay start
		$.LoadingOverlay('show')
		return new Promise ((resolve, reject) => {
			// Define url get all products
			const urlGetAllProducts = 'http://localhost:3000/products'
			// Get products
			axios({
				method: 'get',
				url: urlGetAllProducts
			})
			.then((response) => {
				// Define dataProducts
				let dataProducts = response.data.data
				// Define arrProductsTransaction
				let arrProductsTransaction = []
				// Call get products id function
				getProductsId(getQueryValue().userId)
				.then((objFromClient) => {
					// Define arrProductFromClient
					let arrProductFromClient = objFromClient.arrProductsId
					// Define shipping cost
					let shippingCost = objFromClient.shippingCost
					// Iterate through arr products from database
					dataProducts.forEach((dataProductFromDatabase) => {
						// Iterate through arr products id
						arrProductFromClient.forEach((dataProductFromClient) => {
							// Check if dataProducts._id same with dataProductFromClient from server
							if (dataProductFromDatabase._id === dataProductFromClient.productId) {
								// Push the transaction object
								arrProductsTransaction.push({
									id: dataProductFromDatabase._id,
									name: dataProductFromDatabase.productName,
									price: dataProductFromDatabase.productDiscountPrice || dataProductFromDatabase.productPrice, // check if product discount price is available
									quantity: dataProductFromClient.buyingQty
								})
							}
						})
					})
					// Loading overlay stop
					$.LoadingOverlay('hide')
					// Resolve in object form sending differents data
					resolve({
						arrProductsTransaction: arrProductsTransaction,
						shippingCost: shippingCost
					})
				})
			})
		})
	}

	// Populate query value
	populateQueryValue = () => {
		// Check if data query are available
		if (getQueryValue().email) {
			// Must decode URI component (remove %, =, ? etc)
			$('#cartCustomerEmail').text(decodeURIComponent(getQueryValue().email))
			$('#cartCustomerFirstName').text(decodeURIComponent(getQueryValue().firstName))
			$('#cartCustomerLastName').text(decodeURIComponent(getQueryValue().lastName))
			$('#cartCustomerPhoneNumber').text(decodeURIComponent(getQueryValue().phoneNumber))
			$('#cartOrderTotal').text(decodeURIComponent(getQueryValue().orderTotal))
		} else {
			// Redirect to index.html page
			swal('No order found', 'Please make your order first', 'error')
			.then(() => {
				window.location.replace('index.html')
			})
		}
	}

	// Get transaction by id to find the transactionId (order id not object id)
	// (promise)
	getTransactionIdFromDatabase = () => {
		// Loading overlay start
		$.LoadingOverlay('show')
		return new Promise ((resolve, reject) => {
			// Define transaction id from client
			let transactionIdFromClient = getQueryValue().transactionId
			// Define url get transaction id by id
			const urlGetTransactionById = `http://localhost:3000/transactions/${transactionIdFromClient}`
			// Get the data
			axios({
				method: 'get',
				url: urlGetTransactionById
			})
			.then((response) => {
				// Define data transaction
				let dataTransaction = response.data[0]
				// Loading overlay stop
				$.LoadingOverlay('hide')
				// Resolve transaction id (will be used as order id) and delivery address
				resolve({
					transactionIdFromDatabase: dataTransaction.transactionId,
					deliveryAddressFromDatabase: dataTransaction.deliveryAddress
				})
			})
		})
	}

	// Get value for requesting SNAP on Midtrans
	getValueTransaction = () => {
		return new Promise ((resolve, reject) => {
			// Call get transaction id function
			getTransactionIdFromDatabase().then((databaseTransaction) => {
				// Define orderId
				let orderId = databaseTransaction.transactionIdFromDatabase
				// Define delivery address object
				let deliveryAddress = databaseTransaction.deliveryAddressFromDatabase
				// Parse city, province, and subdistrict id
				parseAddressCode(deliveryAddress.province, deliveryAddress.city, deliveryAddress.subdistrict)
				.then((parsedAddressCode) => {
					// Define parsed province name
					let provinceName = parsedAddressCode.provinceName
					// Define parsed city name
					let cityName = parsedAddressCode.cityName
					// Define parsed subdistrict name
					let subdistrictName = parsedAddressCode.subdistrictName
					// Call get products function
					getProducts().then((objProductsFromClient) => {
						// Define shipping cost object
						let shippingCostObject = {
							id: 'SHIP-FW-123',
							price: objProductsFromClient.shippingCost,
							name: 'shippingCost',
							quantity: 1,
						}
						// Push extra data shipping cost
						objProductsFromClient.arrProductsTransaction.push(shippingCostObject)
						// Create object for bank payment request (refer to Midtrans JSON Object Guidelines)
						let snapRequest = {
							transaction_details: {
								gross_amount: parseInt(decodeURIComponent(getQueryValue().orderTotal)),
								order_id: orderId
							},
							customer_details: {
								email: decodeURIComponent(getQueryValue().email),
								first_name: decodeURIComponent(getQueryValue().firstName),
								last_name: decodeURIComponent(getQueryValue().lastName),
								phone: decodeURIComponent(getQueryValue().phoneNumber),
								shipping_address: {
									first_name: decodeURIComponent(getQueryValue().firstName),
									last_name: decodeURIComponent(getQueryValue().lastName),
									email: decodeURIComponent(getQueryValue().email),
									phone: decodeURIComponent(getQueryValue().phoneNumber),
									address: deliveryAddress.street,
									city: cityName,
									postal_code: deliveryAddress.zipCode,
									country_code: deliveryAddress.country.substring(0,3).toUpperCase() // Get only 3 letters in front and UPPERCASE that string
								}
							},
							item_details: objProductsFromClient.arrProductsTransaction
						}
						// Resolve object
						resolve(snapRequest)
					})
				})
			})
		})
	}

	// ------------------------------------------------------------------------------------------- //

	// Midtrans credit card payment function
	// Create the card object with the required fields
	function card () {
		// Define card details
		let cardholderName = $('#cardHolderNameInput').val()
		let cardNumber = $('#cardNumberInput').val()
		let cardExpiryMonth = $('#cardExpiryDateInput').val().split('/')[0].trim()
		let cardExpiryYear = $('#cardExpiryDateInput').val().split('/')[1].trim()
		let cardCvv = $('#cvvInput').val()
    return {
      card_number: cardNumber,
      card_cvv: cardCvv,
      card_exp_month: cardExpiryMonth,
      card_exp_year: cardExpiryYear
    }
	}

	//Sandbox API URL. TODO: Remove this line when you're ready to go live
	Veritrans.url = "https://api.sandbox.midtrans.com/v2/token";

	//Set your Midtrans credentials
	Veritrans.client_key = 'SB-Mid-client-T3q2zUnratuQuFy3';

	/*Create the callback response function.
	NOTE: This example utilizes JQuery Fancybox.
	You can use other javascript framework to display 3DS dialog*/
	function callback(response) {
    if (response.redirect_url) {
    	console.log(response)
      // If 3Dsecure transaction. Open 3Dsecure dialog
      console.log('Open Dialog 3Dsecure');
      openDialog(response.redirect_url);
    } else if (response.status_code == '200') {
      // success 3d secure or success normal
      //close 3d secure dialog if any
      console.log(response)
      closeDialog();
      // store token data in input #token_id
      $("#token-id").val(response.token_id);
    } else {
    	console.log(response)
      // failed request token
      // Confirm wrong credit card number
      swal('Warning', 'Wrong credit card number', 'warning')
      .then(() => {
      	//close 3d secure dialog if any
	      closeDialog();
	      $('#submit-button').removeAttr('disabled');
	      // Show status message.
	      $('#message').text(response.status_message);
	      console.log(JSON.stringify(response));
      })
    }
  }

  // Open 3DSecure dialog box
  function openDialog(url) {
    // make sure to load fancybox in a script tag
    $.fancybox.open({
      href: url,
      type: 'iframe',
      autoSize: false,
      width: 400,
      height: 420,
      closeBtn: false,
      modal: true
    });
  }

  // Close 3DSecure dialog box
  function closeDialog() {
    $.fancybox.close();
  } 

  // Call this function to get midtrans token
  // Veritrans.token(card, callback);

  // ------------------------------------------------------------------------------------------- //

  // Process payment
  processPayment = () => {
  	// Loading overlay start
  	$.LoadingOverlay('show')
  	return new Promise ((resolve, reject) => {
  		// Call function get transaction details data
	  	getValueTransaction().then((midtransTransactionObject) => {
	  		// Define url SNAP to midtrans API
	  		const urlMidtransSnap = 'http://localhost:3000/midtrans/snap'
	  		// Post transaction to request SNAP TOKEN
	  		axios({
	  			method: 'post',
	  			url: urlMidtransSnap,
	  			data: midtransTransactionObject
	  		})
	  		.then((response) => {
	  			// Loading overlay stop
	  			$.LoadingOverlay('hide')
	  			resolve(response.data)
	  		})
	  		.catch((err) => {
	  			console.log(err)
	  			reject(err)
	  		})
			})
  	})
  }

	// On load
	$('#divBankDetails').hide()
	$('#divCardDetails').hide()
	populateQueryValue()

	// On click button proceed payment
	$('#btnProceedPayment').click(() => {
		// Call the process payment function
		processPayment().
		then((response) => {
			console.log(response)
		})
		.catch((err) => {
			console.log(err)
		})
		// Clear all localStorage data
		localStorage.clear()
	})

	// Loading overlay stop
	$.LoadingOverlay('hide')

})