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
import _ from "@node-wot/core";

// node-wot implementation of W3C WoT Servient 
import { Servient } from "@node-wot/core";
import { HttpServer } from "@node-wot/binding-http";

// exposed protocols
import { CoapServer } from "@node-wot/binding-coap";


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

enum AASSemLogic {
  EQUAL,
  GREATERTHAN,
  GREATEROREQUALTHAN,
  LESSERTHAN,
  LESSEROREQUALTHAN
}

enum AASSemType {
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
  subthing: WoT.ExposedThing,
  PVSLs: Array<PVSLInternal>
}


let wotaas: WoT.ExposedThing;

let submodels: Array<SubmodelInternal>;


main();

// main logic 
function main() {

  let servient = new Servient();

  servient.addServer(new HttpServer());
  servient.addServer(new CoapServer());

  servient.start().then(wot => {
    console.info('RaspberryServient started');

    // XXX: Add wotaas context, check what this si about with metadata and semantictypes
    let thingInit: WoT.ThingTemplate = { name: 'wotaas' };

    let thing = wot.produce(thingInit);
    if (typeof thing != undefined) {
      wotaas = thing;

      // Link to Asset this AAS is for
      let thingPropertyAASID: WoT.ThingPropertyInit = {
        name: 'assetid',
        writable: false,
        observable: false,
        //semanticTypes: [{ name: 'assetid', context: 'http://siemens.com/wotaas/context', prefix: 'wotaas' }],
        type: JSON.stringify({ "type": "uri" }),
        value: "siemens.com/wotaas/device1"
      };

      // Assuming user with full rights, showing all available services

      // Services

      // Create Submodel
      let thingActionCreateSubmodel: WoT.ThingActionInit = {
        name: 'createsubmodel',
        inputDataDescription: JSON.stringify({
          'type': 'object',
          'properties': {
            'name': { 'type': 'string', 'minimum': 3, 'maximum': 255 },
            'parentID': { 'type': 'uri' },
            'modelID': { 'type': 'uri' },
            'version': { 'type': 'integer', 'minimum': 0 },
            'revision': { 'type': 'integer', 'minimum': 0 }//,
            //'placement' : {} XXX: How to handle placement?
          }
        }),
        // TODO: Can output be of different structure depending on statuscode?
        outputDataDescription: JSON.stringify({
          'type': 'object',
          'properties': {
            'statuscode': { 'type': 'integer', 'minimum': 0, 'maximum': 999 },
            'uri': { 'type': 'uri' }
          }
        })
      };

      // Delete Submodel
      let thingActionDeleteSubmodel: WoT.ThingActionInit = {
        name: 'deletesubmodel',
        inputDataDescription: JSON.stringify({
          'type': 'object',
          'properties': {
            'name': { 'type': 'string', 'minimum': 3, 'maximum': 255 },
            'parentID': { 'type': 'uri' },
            'modelID': { 'type': 'uri' },
            'version': { 'type': 'integer', 'minimum': 0 },
            'revision': { 'type': 'integer', 'minimum': 0 }//,
            //'placement' : {} XXX: How to handle placement?
          }
        }),
        outputDataDescription: JSON.stringify({
          'statuscode': { 'type': 'integer', 'minimum': 0, 'maximum': 999 },
        })
      };

      // Create PVSL/C
      let thingActionCreatePVSL: WoT.ThingActionInit = {
        name: 'createpvsl',
        inputDataDescription: JSON.stringify({
          'type': 'object',
          'properties': {
            'name': { 'type': 'string', 'minimum': 3, 'maximum': 255 },
            'carrierID': { 'type': 'uri' },
            'parentSubmodelID': { 'type': 'uri' }
          }
        }),
        // TODO: Can output be of different structure depending on statuscode?
        outputDataDescription: JSON.stringify({
          'type': 'object',
          'properties': {
            'statuscode': { 'type': 'integer', 'minimum': 0, 'maximum': 999 },
            'uri': { 'type': 'uri' }
          }
        })
      };

      // Delete PVSL/C
      let thingActionDeletePVSL: WoT.ThingActionInit = {
        name: 'deletepvsl',
        inputDataDescription: JSON.stringify({
          'type': 'object',
          'properties': {
            'name': { 'type': 'string', 'minimum': 3, 'maximum': 255 },
            'carrierID': { 'type': 'uri' },
            'parentSubmodelID': { 'type': 'uri' }
          }
        }),
        // TODO: Can output be of different structure depending on statuscode?
        outputDataDescription: JSON.stringify({
          'type': 'object',
          'properties': {
            'statuscode': { 'type': 'integer', 'minimum': 0, 'maximum': 999 }
          }
        })
      };

      // Create PVS
      let thingActionCreatePVS: WoT.ThingActionInit = {
        name: 'createpvs',
        inputDataDescription: JSON.stringify({
          'type': 'object',
          'properties': {
            'name': { 'type': 'string', 'minimum': 3, 'maximum': 255 },
            'IDSpec': { 'type': 'string' },
            'IDSpecType': { 'type': 'string', 'enum': ['URI', 'ISO29005_5'] },
            'dataType': { 'type': 'string', 'enum': ['BOOL', 'FLOAT', 'DOUBLE', 'STRING', 'INT32', 'INT64', 'UINT32', 'UINT64', 'IDENTIFICATION'] },
            'value': {},
            'expressionSemantic': { 'type': 'string', 'enum': ['ASSURANCE', 'REQUIREMENT', 'MEASUREMENT', 'SETTING'] },
            'expressionLogic': { 'type': 'string', 'enum': ['EQUAL', 'GREATERTHAN', 'GREATEROREQUALTHAN', 'LESSERTHAN', 'LESSEROREQUALTHAN'] },
            'PVSLID': { 'type': 'uri' }
          }
        }),
        // TODO: Can output be of different structure depending on statuscode?
        outputDataDescription: JSON.stringify({
          'type': 'object',
          'properties': {
            'statuscode': { 'type': 'integer', 'minimum': 0, 'maximum': 999 },
            'uri': { 'type': 'uri' }
          }
        })
      };

      // XXX: This here is a problem, value is no needed argument, create new type for deleting PVS?
      // Delete PVS
      let thingActionDeletePVS: WoT.ThingActionInit = {
        name: 'deletepvs',
        inputDataDescription: JSON.stringify({
          'type': 'object',
          'properties': {
            'name': { 'type': 'string', 'minimum': 3, 'maximum': 255 },
            'IDSpec': { 'type': 'string' },
            'IDSpecType': { 'type': 'string', 'enum': ['URI', 'ISO29005_5'] },
            'dataType': { 'type': 'string', 'enum': ['BOOL', 'FLOAT', 'DOUBLE', 'STRING', 'INT32', 'INT64', 'UINT32', 'UINT64', 'IDENTIFICATION'] },
            'expressionSemantic': { 'type': 'string', 'enum': ['ASSURANCE', 'REQUIREMENT', 'MEASUREMENT', 'SETTING'] },
            'expressionLogic': { 'type': 'string', 'enum': ['EQUAL', 'GREATERTHAN', 'GREATEROREQUALTHAN', 'LESSERTHAN', 'LESSEROREQUALTHAN'] },
            'PVSLID': { 'type': 'uri' }
          }
        }),
        // TODO: Can output be of different structure depending on statuscode?
        outputDataDescription: JSON.stringify({
          'type': 'object',
          'properties': {
            'statuscode': { 'type': 'integer', 'minimum': 0, 'maximum': 999 }
          }
        })
      };

      wotaas
        .addProperty(thingPropertyAASID)
        // AASID needs no handler, is readonly
        .addAction(thingActionCreateSubmodel)
        .setActionHandler(
        (newmodel: Submodel) => {
          return new Promise((resolve, reject) => {
            // Perform checks on input data and try to create new model
            try {
              if (newmodel.name.length < 3 || newmodel.name.length > 255) {
                return JSON.stringify({ 'statuscode': 400, 'uri': null });
              }
              // Check if name or other identifier already existent
              for (let smodel of submodels) {
                // TODO: Is modelID also to be checked?
                if (smodel.name == newmodel.name) {
                  return JSON.stringify({ 'statuscode': 409, 'uri': null });
                }
              }
              // Check parentID and modelID for proper URI
              // TODO: Is this an URL or can it be an URI?

              // Check revision and version          
              if (newmodel.revision < 0 || newmodel.version < 0) {
                return JSON.stringify({ 'statuscode': 400, 'uri': null });
              }


            } catch (error) {
              console.warn('Creating new Submodel failed (0). ' + error);
              return JSON.stringify({ 'statuscode': 500, 'uri': null });
            }

            // create new submodel
            try {
              // TODO: Submodel TD structure still a bit unclear
              // What will be name, how to show that it is a submodel? Metadata?
              // Proposal: link to aas-TD, additional metadata showing its an aas-sm
              //           

              // create thing for new submodel
              let subThing: WoT.ThingTemplate = { 'name': newmodel.name };

              // Add metadata
              // TODO: Mark as Submodel

              let newsub: SubmodelInternal = {
                name: newmodel.name,
                modelID: newmodel.modelID,
                parentID: newmodel.parentID,
                revision: newmodel.revision,
                version: newmodel.version,
                PVSLs: new Array<PVSLInternal>(),
                subthing: wot.produce(subThing)
              };

              submodels.push(newsub);

            } catch (error) {
              console.warn('Creating new Submodel failed (1). ' + error);
              return JSON.stringify({ 'statuscode': 500, 'uri': null });
            }

            //'200' + urri; // XXX: URI where TD of new submodel can be found 
            resolve(JSON.stringify({ 'statuscode': 200, 'uri': '/' + newmodel.name }));
          });
        },
        thingActionCreateSubmodel.name
        )
        .addAction(thingActionDeleteSubmodel)
        .setActionHandler(
        (delmodel: Submodel) => {
          return new Promise((resolve, reject) => {
            // Perform checks on inut data and try to locate submodel and delete it        
            try {
              // Check name
              if (delmodel.name.length < 3 || delmodel.name.length > 255) {
                return JSON.stringify({ 'statuscode': 400, 'uri': null });
              }

              // parentID and modelID have to be checked only for length,
              // if it is no valid URI the check will fail anyway later
              // TODO Check these

              // Check revision and version          
              if (delmodel.revision < 0 || delmodel.version < 0) {
                return JSON.stringify({ 'statuscode': 400, 'uri': null });
              }

            } catch (error) {
              console.warn('Deleting Submodel failed (0). ' + error);
              return JSON.stringify({ 'statuscode': 500, 'uri': null });
            }
            try {
              //Check if name or other identifier existent
              for (let smodel of submodels) {
                if (smodel.name == delmodel.name && smodel.modelID == delmodel.modelID && smodel.parentID == delmodel.parentID && smodel.revision == delmodel.revision && smodel.version == delmodel.version) {
                  // This is the model to be deleted
                  // Check if the Submodel hast PVSL running
                  if (smodel.PVSLs.length > 0) {
                    // TODO: Do we break here and say, client must delete PVSL first or do we do it for the client?

                  }
                  // XXX: Right now TDs can't be removed, so this function must always fail for now :(
                  return JSON.stringify({ 'statuscode': 500 });
                }
              }
              resolve(JSON.stringify({ 'statuscode': 404 }));
            } catch (error) {
              console.warn('Deleting Submodel failed (1). ' + error);
              return JSON.stringify({ 'statuscode': 500, 'uri': null });
            }
          });
        },
        thingActionDeleteSubmodel.name
        )
        .addAction(thingActionCreatePVSL)
        .setActionHandler(
        (newpvsl: PVSL) => {
          return new Promise((resolve, reject) => {
            // Perform checks on input data and try to create new PVSL
            try {
              if (newpvsl.name.length < 3 || newpvsl.name.length > 255) {
                return JSON.stringify({ 'statuscode': 400, 'uri': null });
              }
              // Check additional fields
              // TODO Check fields

              // Check if parentSubmodel exists //XXX: Check if this okay like it is written
              for (let smodel of submodels) {
                if (smodel.modelID == newpvsl.parentSubmodelID) {
                  // Ok, submodel exists, go on
                  // Check if name or other identifier already existent
                  for (let list of smodel.PVSLs) {
                    // TODO: Is carriedID also to be checked?
                    if (list.name == newpvsl.name) {
                      return JSON.stringify({ 'statuscode': 409, 'uri': null });
                    }
                  }

                  // create new PVSL and link it
                  let npvsl: PVSLInternal = {
                    name: newpvsl.name,
                    carrierID: newpvsl.carrierID,
                    parentSubmodelID: newpvsl.parentSubmodelID,
                    statements: new Array<PVSInternal>()
                  };
                  smodel.PVSLs.push(npvsl);

                  // Create new property for the pvsl
                  // TODO: Add metadata to express it is a pvsl 
                  let thingPropertyNewPVSL: WoT.ThingPropertyInit = {
                    name: npvsl.name,
                    writable: false,
                    observable: true,
                    //semanticTypes: [{ name: 'assetid', context: 'http://siemens.com/wotaas/context', prefix: 'wotaas' }],
                    type: JSON.stringify(
                      {
                        'type': 'object',
                        'properties': {
                          'name': { 'type': 'string' },
                          'carriedID': { 'type': 'uri' },
                          'parentSubmodelID': { 'type': 'uri' },
                          'pvs': {
                            'type': 'array',
                            'uniqueItems': true,
                            'additionalItems': false,
                            'items': {
                              'type': 'object',
                              'properties': {
                                'name': { 'type': 'string' },
                                'IDSpec': { 'type': 'string' },
                                'IDSpecType': { 'type': 'string', 'enum': ['URI', 'ISO29005_5'] },
                                'dataType': { 'type': 'string', 'enum': ['BOOL', 'FLOAT', 'DOUBLE', 'STRING', 'INT32', 'INT64', 'UINT32', 'UINT64', 'IDENTIFICATION'] },
                                'value' : {},
                                'expressionSemantic': { 'type': 'string', 'enum': ['ASSURANCE', 'REQUIREMENT', 'MEASUREMENT', 'SETTING'] },
                                'expressionLogic': { 'type': 'string', 'enum': ['EQUAL', 'GREATERTHAN', 'GREATEROREQUALTHAN', 'LESSERTHAN', 'LESSEROREQUALTHAN'] }
                              }
                            }
                          }
                        }
                      }
                    ),
                    value: JSON.stringify({ 'name': newpvsl.name, 'carriedID': newpvsl.carrierID, 'parentSubmodelID': newpvsl.parentSubmodelID, 'pvs': [] })
                  };
                  smodel.subthing.addProperty(thingPropertyNewPVSL);
                  // Right now for updating the PVSL entries we must use writeProperty to update value

                  //TODO: Write readHandler as soon as implemented                  
                  //smodel.subthing.setPropertyReadHandler(

                  //  thingPropertyNewPVSL.name
                  //);

                  //XXX: Check returned uri, what way is useful, what should be returned?
                  resolve(JSON.stringify({ 'statuscode': 200, 'uri': null }));
                }
              }

            } catch (error) {
              console.warn('Creating new Submodel failed (0). ' + error);
              return JSON.stringify({ 'statuscode': 500, 'uri': null });
            }

            //return '400' since submodel could not be found
            return JSON.stringify({ 'statuscode': 400, 'uri': null });
          });
        },
        thingActionCreatePVSL.name
        )
        .addAction(thingActionCreatePVSL)
        .setActionHandler(
        (newpvs: PVS) => {
          return new Promise((resolve, reject) => {
            // Perform checks on input data and try to create new PVS
            try {
              if (newpvs.name.length < 3 || newpvs.name.length > 255) {
                return JSON.stringify({ 'statuscode': 400, 'uri': null });
              }
              // Check additional fields
              // TODO Check fields for correct values if needed (some will fail at check anyway)

              // Check if parentPVSL exists //XXX: Check if this okay like it is written
              for (let smodel of submodels) {
                for(let list of smodel.PVSLs) {
                  // XXX: What is the ID of the list?
                  if(newpvs.parentPVSL_ID == list.name)
                  {
                    // Okay we have the right list, check for doubles
                    for(let pvss of list.statements)
                    {
                      if(newpvs.name == pvss.name || (newpvs.IDSpec == pvss.IDSpec && newpvs.IDSpecType == pvss.IDSpecType))
                      {
                        // Some other entry with either the name of the ID exists
                        return JSON.stringify({ 'statuscode': 409, 'uri': null });
                      }
                    }

                    // Okay, no doubles so far, we can create the PVS entry
                    let newpvs_int : PVSInternal = {
                      name: newpvs.name,
                      IDSpec : newpvs.IDSpec,
                      IDSpecType : newpvs.IDSpecType,
                      dataType : newpvs.dataType,
                      value : newpvs.value,
                      expressionSemantic : newpvs.expressionSemantic,
                      expressionLogic : newpvs.expressionLogic
                    };
                    // Add it to the list
                    list.statements.push(newpvs_int);

                    // Update the value of the List-Property
                    let valuestring: string = JSON.stringify({ 'name': list.name, 'carriedID': list.carrierID, 'parentSubmodelID': list.parentSubmodelID, 'pvs': list.statements });
                    smodel.subthing.writeProperty(list.name, valuestring);

                    //XXX: Check returned uri, what way is useful, what should be returned?
                    resolve(JSON.stringify({ 'statuscode': 200, 'uri': null }));
                  }
                }
              }                

            } catch (error) {
              console.warn('Creating new PVS failed (0). ' + error);
              return JSON.stringify({ 'statuscode': 500, 'uri': null });
            }

            //return '400' since list could not be found
            return JSON.stringify({ 'statuscode': 400, 'uri': null });
          });
        },
        thingActionCreatePVS.name
        );
    }
  });
}
// helper

function ValidURL(str: string) {
  var pattern = new RegExp('^(https?:\/\/)?' + // protocol
    '((([a-z\d]([a-z\d-]*[a-z\d])*)\.)+[a-z]{2,}|' + // domain name
    '((\d{1,3}\.){3}\d{1,3}))' + // OR ip (v4) address
    '(\:\d+)?(\/[-a-z\d%_.~+]*)*' + // port and path
    '(\?[;&a-z\d%_.~+=-]*)?' + // query string
    '(\#[-a-z\d_]*)?$', 'i'); // fragment locater
  if (!pattern.test(str)) {
    return false;
  } else {
    return true;
  }
}

