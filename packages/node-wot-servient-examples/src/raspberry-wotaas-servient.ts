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
enum AASIDType {
    URI,
    ISO29005_5
}

enum AASDataType {
  BOOL, 
  FLOAT, 
  DOUBLE, 
  STRING, 
  INT32, 
  INT64, 
  UINT32, 
  UINT64, 
  IDENTIFICATION
}

enum AASSemLogic{
  EQUAL,
  GREATERTHAN,
  GREATEROREQUALTHAN,
  LESSERTHAN,
  LESSEROREQUALTHAN
}

enum AASSemType{
  ASSURANCE,
  REQUIREMENT,
  MEASUREMENT, 
  SETTING
}

declare interface PVSInternal {
  name: string,
  IDSpec: string, // Either URI or ISO29005_5
  IDSpecType: AASIDType,
  dataType: AASDataType,
  value: any,
  expressionSemantic: AASSemType,
  expressionLogic: AASSemLogic,

  // Views
  // Visibility
  // List to appear in (this is not needed since directly stored in list)
}

declare interface PVS extends PVSInternal {
  parentPVSL_ID: USVString,
  // Views
  // Visibility  
}

declare interface PVSL {
  name: string,
  carrierID: USVString, //assetID!
  parentSubmodelID: USVString, // URI of submodel  
}

declare interface PVSLInternal extends PVSL {
  statements: Array<PVSInternal>
}


declare interface Submodel {
  name: string,
  parentID: USVString, //ID of AAS, not of Asset
  modelID: USVString,  //"SubModel Definition ID"
  version: number,
  revision: number

  //'placement' : string XXX: How to handle placement?
}

declare interface SubmodelInternal extends Submodel {
  subthing : wotaas.ExposedThing,
  PVSLs : Array<PVSL>
}


let wotaas: WoT.ExposedThing;

let submodels: Array<SubmodelInternal>;


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

  // XXX: Add wotaas context

  let thing = wot.expose(thingInit);
  if (typeof thing != undefined) {
    wotaas = thing;

    // Link to Asset this AAS is for
    let thingPropertyAASID: WoT.ThingPropertyInit = {
      name: 'assetid',
      writable: false,
      observable: false,
      semanticTypes: [{ name: 'assetid', context: 'http://siemens.com/wotaas/context', prefix: 'wotaas' }],
      type: JSON.stringify({ "type": "URI" }),
      initValue: "siemens.com/wotaas/device1"      
    };

    // Assuming user with full rights, showing all available services
 
    // Services

    // Create Submodel
    let thingActionInitCreateSubmodel: WoT.ThingActionInit = {
      name: 'createsubmodel',
      inputType: JSON.stringify({
        'type': 'object',
        'properties': {
          'name': { 'type': 'string', 'minimum': 3, 'maximum': 255 },
          'parentID': { 'type': 'URI' },
          'modelID': { 'type': 'URI' },
          'version': { 'type' : 'integer', 'minimum': 0 },
          'revision': { 'type': 'integer', 'minimum': 0 }//,
          //'placement' : {} XXX: How to handle placement?
        }
      }),
      // TODO: Can output be of different structure depending on statuscode?
      outputType: JSON.stringify({
        'type': 'object',
        'properties': {
          'statuscode': { 'type': 'integer', 'minimum': 0, 'maximum': 999 },
          'uri': { 'type': 'URI' }
        }
      }),
      action: (newmodel: Submodel) => {

        // Perform checks on input data and try to create new model
        try {
          if (newmodel.name.length < 3 || newmodel.name.length > 255) {
            return JSON.stringify({ 'statuscode': 400, 'uri': null });
          }
          //Check if name or other identifier already existent
          for (let smodel of submodels) {
            // TODO: Is modelID also to be checked?
            if (smodel.name == newmodel.name) {
              return JSON.stringify({ 'statuscode': 409, 'uri': null });
            }
          }
          //Check parentID and modelID for proper URI
          // TODO: Is this an URL or can it be an URI?
          
          // Check revision and version          
          if(newmodel.revision < 0 || newmodel.version < 0)
          {
            return JSON.stringify({ 'statuscode': 400, 'uri': null });
          }
          

        } catch (error) {
          console.warn('Creating new Submodel failed (0). ' + error);
          return JSON.stringify({'statuscode': 500, 'uri': null});
        }        

        // create new submodel

        let newsub: SubmodelInternal;

        newsub.name = newmodel.name;
        newsub.modelID = newmodel.modelID;
        newsub.parentID = newmodel.parentID;
        newsub.revision = newmodel.revision;
        newsub.version = newmodel.version;

        // TODO: Submodel TD structure still a bit unclear
        // What will be name, how to show that it is a submodel? Metadata?
        //

        // create thing for new submodel
        let subThing: WoT.ThingTemplate = { 'name': newsub.name };
        // Add metadata

        // let thingPropertyAASID: WoT.ThingPropertyInit = {
        //   name: 'assetid',
        //   writable: false,
        //   observable: false,
        //   semanticTypes: [{ name: 'assetid', context: 'http://siemens.com/wotaas/context', prefix: 'wotaas' }],
        //   type: JSON.stringify({ "type": "URI" }),
        //   initValue: "siemens.com/wotaas/device1"
        // };

        // Submodel TD is prepared, expose it
        newsub.subthing = wot.expose(subThing);        

        submodels.push(newsub);     

        //return '200' + urri; // XXX: URI where TD of new submodel can be found
        return JSON.stringify({ 'statuscode': 200, 'uri': '/' + newsub.name });
      }
    };

    // Delete Submodel
    let thingActionInitDeleteSubmodel: WoT.ThingActionInit = {
      name: 'deletesubmodel',
      inputType: JSON.stringify({
        'type': 'object',
        'properties': {
          'name': { 'type': 'string', 'minimum': 3, 'maximum': 255 },
          'parentID': { 'type': 'URI' },
          'modelID': { 'type': 'URI' },
          'version': { 'type' : 'integer', 'minimum': 0 },
          'revision': { 'type': 'integer', 'minimum': 0 }//,
          //'placement' : {} XXX: How to handle placement?
        }
      }),
      outputType: JSON.stringify({
        'statuscode': { 'type': 'integer', 'minimum': 0, 'maximum': 999 },
      }),
      action: (delmodel: Submodel) => {

        // Perform checks on inut data and try to locate submodel and delete it        
        try {
          // Check name
          if (delmodel.name.length < 3 || delmodel.name.length > 255) {
            return JSON.stringify({ 'statuscode': 400, 'uri': null });
          }
                    
          // Check parentID and modelID for proper URI
          // TODO: Is this an URL or can it be an URI?
          
          // Check revision and version          
          if(delmodel.revision < 0 || delmodel.version < 0)
          {
            return JSON.stringify({ 'statuscode': 400, 'uri': null });
          }          

        } catch (error) {
          console.warn('Deleting Submodel failed (0). ' + error);
          return JSON.stringify({'statuscode': 500, 'uri': null});
        }

        //Check if name or other identifier existent
        for (let smodel of submodels) {
          if (smodel.name == delmodel.name && smodel.modelID == delmodel.modelID && smodel.parentID == delmodel.parentID && smodel.revision == delmodel.revision && smodel.version == delmodel.version) {
            // This is the model to be deleted
            // Check if the Submodel hast PVSL running
            if(smodel.PVSLs.length > 0)
            {
              // TODO: Do we break here and say, client must delete PVSL first or do we do it for the client?

            }
            // XXX: Right now TDs can't be removed, so this function must always fail for now :(
            return JSON.stringify({'statuscode': 500});  
          }
        }       

        return JSON.stringify({'statuscode': 404});

      }
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
    wotaas
      .addProperty(thingPropertyAASID)
      .addAction(thingActionInitCreateSubmodel)
      .addAction(thingActionInitDeleteSubmodel);
    //   .addProperty(thingPropertyInitColor)
    //   .addAction(thingActionInitGradient)
    //   .addAction(thingActionInitCancel);
  }


}

// helper

function ValidURL(str) {
  var pattern = new RegExp('^(https?:\/\/)?'+ // protocol
    '((([a-z\d]([a-z\d-]*[a-z\d])*)\.)+[a-z]{2,}|'+ // domain name
    '((\d{1,3}\.){3}\d{1,3}))'+ // OR ip (v4) address
    '(\:\d+)?(\/[-a-z\d%_.~+]*)*'+ // port and path
    '(\?[;&a-z\d%_.~+=-]*)?'+ // query string
    '(\#[-a-z\d_]*)?$','i'); // fragment locater
  if(!pattern.test(str)) {
    return false;
  } else {
    return true;
  }
}

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
