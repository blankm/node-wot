/*
 * W3C Software License
 *
 * Copyright (c) 2017 the thingweb community
 *
 * THIS WORK IS PROVIDED "AS IS," AND COPYRIGHT HOLDERS MAKE NO REPRESENTATIONS OR
 * WARRANTIES, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO, WARRANTIES OF
 * MERCHANTABILITY OR FITNESS FOR ANY PARTICULAR PURPOSE OR THAT THE USE OF THE
 * SOFTWARE OR DOCUMENT WILL NOT INFRINGE ANY THIRD PARTY PATENTS, COPYRIGHTS,
 * TRADEMARKS OR OTHER RIGHTS.
 *
 * COPYRIGHT HOLDERS WILL NOT BE LIABLE FOR ANY DIRECT, INDIRECT, SPECIAL OR
 * CONSEQUENTIAL DAMAGES ARISING OUT OF ANY USE OF THE SOFTWARE OR DOCUMENT.
 *
 * The name and trademarks of copyright holders may NOT be used in advertising or
 * publicity pertaining to the work without specific, written prior permission. Title
 * to copyright in this work will at all times remain with copyright holders.
 */

import ThingDescription from '../../td/thing-description';
import * as TDParser from '../../td/td-parser';

/* sample TD json-ld string from the CP page*/
let td_jsonld = '{"@context": ["http://w3c.github.io/wot/w3c-wot-td-context.jsonld"],"@type": "Thing","name": "MyTemperatureThing","interactions": [{"@type": ["Property"],"name": "temperature","outputData": {"valueType": { "type": "number" }},"writable": true,"links": [{"href" : "coap://mytemp.example.com:5683/temp","mediaType": "application/json"}]}]}';

let td: ThingDescription = TDParser.parseTDString(td_jsonld)

console.log('\nTD as Object:')
console.log(' Thing name: ' + td.name)
console.log(' Interaction name: ' + td.interactions[0].name);
console.log(' Interaction link: ' + td.interactions[0].links[0].href);
console.log(' Is writable: ' + td.interactions[0].writable);
/* ... */

console.log('\nTD as JSON Sting:')
/* back to JSON string */
console.log(TDParser.serializeTD(td))

/* test uri composition with base and local relativ path */
td_jsonld = '{"@context": ["http://w3c.github.io/wot/w3c-wot-td-context.jsonld"],"@type": "Thing","name": "MyTemperatureThing","base":"coap://mytemp.example.com:5683","interactions": [{"@type": ["Property"],"name": "temperature","outputData": {"valueType": { "type": "number" }},"writable": false,"links": [{"href" : "temp","mediaType": "application/json"}]}]}';

let td: ThingDescription = TDParser.parseTDString(td_jsonld)

console.log('\nTest URI resolutions:')
console.log(' Thing name: ' + td.name)
console.log(' Interaction name: ' + td.interactions[0].name);
console.log(' Interaction link: ' + td.interactions[0].links[0].href)
console.log(' Is writable: ' + td.interactions[0].writable);
/* ... */
