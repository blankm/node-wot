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


'use strict'

// global W3C WoT Scripting API definitions
import _ from 'node-wot'; // 'wot-typescript-definitions';
// node-wot implementation of W3C WoT Servient 
import { Servient } from 'node-wot';
import { HttpServer } from "node-wot-protocol-http";

// exposed protocols
import { CoapServer } from 'node-wot-protocol-coap';


// local definition
// declare interface Color {
//   r: number,
//   g: number,
//   b: number
// }

let wotaas: WoT.ExposedThing;
// let gradient: Array<Color>;
// let gradientTimer: any;
// let gradIndex: number = 0;
// let gradNow: Color;
// let gradNext: Color;
// let gradVector: Color;

main();

// main logic 
function main() {

  let servient = new Servient();

  servient.addServer(new HttpServer());
  servient.addServer(new CoapServer());

  // get WoT object for privileged script
  let wot = servient.start();
  console.info('RaspberryServient started');

  let thingInit: WoT.ThingTemplate = { 'name': 'wotaas' };

  // XXX: Add wot context

  let thing = wot.expose(thingInit);
  if (typeof thing != undefined) {
    wotaas = thing;

    let thingPropertyAASID: WoT.ThingPropertyInit = {
      name: 'id',
      writable: false,
      observable: false,
      semanticTypes: [{ name: 'aasid', context: 'http://siemens.com/wotaas/context', prefix: 'wotaas' }],
      type: JSON.stringify({ "type": "URI" }),
      initValue: "siemens.com/wotaas/device1"      
    };

    // let thingPropertyInitBrightness: WoT.ThingPropertyInit = {
    //   name: 'brightness',
    //   writable: true,
    //   type: JSON.stringify({ "type": "integer", 'minimum': 0, 'maximum': 255 }),
    //   initValue: 50,
    //   onWrite: (old, nu) => {
    //     setBrightness(nu);
    //   }
    // };

    // let thingPropertyInitColor: WoT.ThingPropertyInit = {
    //   name: 'color',
    //   type: JSON.stringify({
    //     'type': 'object',
    //     'properties': {
    //       'r': { 'type': 'integer', 'minimum': 0, 'maximum': 255 },
    //       'g': { 'type': 'integer', 'minimum': 0, 'maximum': 255 },
    //       'b': { 'type': 'integer', 'minimum': 0, 'maximum': 255 }
    //     }
    //   }),
    //   initValue: { r: 0, g: 0, b: 0 },
    //   onWrite: (old, nu) => {
    //     setAll(nu.r, nu.g, nu.b);
    //   }
    // };

    // let thingActionInitGradient: WoT.ThingActionInit = {
    //   name: 'gradient',
    //   inputType: JSON.stringify({
    //     'type': 'array',
    //     'items': {
    //       'type': 'object',
    //       'properties': {
    //         'r': { 'type': 'integer', 'minimum': 0, 'maximum': 255 },
    //         'g': { 'type': 'integer', 'minimum': 0, 'maximum': 255 },
    //         'b': { 'type': 'integer', 'minimum': 0, 'maximum': 255 }
    //       }
    //     },
    //     'minItems': 2
    //   }),
    //   outputType: JSON.stringify({ 'type': 'string' }),
    //   action: (gradarray: Array<Color>) => {
    //     if (gradarray.length < 2) { return "{minItems: 2}"; }

    //     wotaas.invokeAction('cancel');

    //     gradient = gradarray;
    //     gradIndex = 0;
    //     gradNow = gradient[0];
    //     gradNext = gradient[1];
    //     gradVector = {
    //       r: (gradNext.r - gradNow.r) / 20,
    //       g: (gradNext.g - gradNow.g) / 20,
    //       b: (gradNext.b - gradNow.b) / 20
    //     };
    //     gradientTimer = setInterval(gradientStep, 50);
    //     return 'OK';

    //   }
    // };
    // let thingActionInitCancel: WoT.ThingActionInit = {
    //   name: 'cancel',
    //   inputType: null,
    //   outputType: JSON.stringify({ 'type': 'string' }),
    //   action: () => {
    //     if (gradientTimer) {
    //       console.log('>> canceling timer');
    //       clearInterval(gradientTimer);
    //       gradientTimer = null;
    //     }
    //     return 'OK';
    //   }
    // };
    // wotaas
    //   .addProperty(thingPropertyInitBrightness)
    //   .addProperty(thingPropertyInitColor)
    //   .addAction(thingActionInitGradient)
    //   .addAction(thingActionInitCancel);
  }


}

// helper
// function roundColor(color: Color): Color {
//   return { r: Math.round(color.r), g: Math.round(color.g), b: Math.round(color.b) };
// }

// function gradientStep() {
//   gradNow = {
//     r: (gradNow.r + gradVector.r),
//     g: (gradNow.g + gradVector.g),
//     b: (gradNow.b + gradVector.b)
//   };
//   wotaas.writeProperty('color', roundColor(gradNow));
//   if (gradNow.r === gradNext.r && gradNow.g === gradNext.g && gradNow.b === gradNext.b) {
//     gradNow = gradient[gradIndex];
//     gradIndex = ++gradIndex % gradient.length;
//     gradNext = gradient[gradIndex];
//     console.log('> step new index ' + gradIndex);
//     gradVector = {
//       r: (gradNext.r - gradNow.r) / 20,
//       g: (gradNext.g - gradNow.g) / 20,
//       b: (gradNext.b - gradNow.b) / 20
//     };
//   }
// }

// function setBrightness(val: number) {
//   if (!client) {
//     console.log('not connected');
//     return;
//   }
//   client.write(new Buffer([0, val, 3]));
// }

// function setPixel(x: number, y: number, r: number, g: number, b: number) {
//   if (!client) {
//     console.log('not connected');
//     return;
//   }
//   client.write(new Buffer([1, x, y, g, r, b]));
// }

// function show() {
//   if (!client) {
//     console.log('not connected');
//     return;
//   }
//   client.write(new Buffer([3]));
// }

// function setAll(r: number, g: number, b: number) {
//   if (!client) {
//     console.log('not connected');
//     return;
//   }
//   let all = [2];
//   for (let i = 0; i < 64; ++i) {
//     all.push(g);
//     all.push(r);
//     all.push(b);
//   }
//   all.push(3);
//   client.write(new Buffer(all));
// }
