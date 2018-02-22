var targetUri = "http://localhost:8080/counter";
var targetUriProperties = "http://localhost:8080/counter/properties";
var counterUri = "http://localhost:8080/counter/properties/count";

WoT.fetchTD(targetUri)
.then(function(td) {
	let thing = WoT.consume(td);
	
	// read property
	thing.readProperty("count")
	.then(function(count){
		console.log("count value is ", count);
    })
	.catch(err => { throw err });
	
	// increment property #1
	thing.invokeAction("increment")
	.then(function(count){
		console.log("count value after increment #1 is ", count);
    })
	.catch(err => { throw err });
	
	// increment property #2
	thing.invokeAction("increment")
	.then(function(count){
		console.log("count value after increment #2 is ", count);
    })
	.catch(err => { throw err });
	
	// decrement property
	thing.invokeAction("decrement")
	.then(function(count){
		console.log("count value after decrement is ", count);
    })
	.catch(err => { throw err });
	
})
.catch(err => { throw err });
