/*
 * W3C Software License
 *
 * Copyright (c) 2018 the thingweb community
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

import { Observable } from "rxjs/Observable";
import * as WoT from "wot-typescript-definitions";

import { ThingDescription } from "@node-wot/td-tools";

import Servient from "./servient";
import ExposedThing from "./exposed-thing";
import ConsumedThing from "./consumed-thing";
import * as Helpers from "./helpers";
import * as TDParser from "@node-wot/td-tools";

export default class WoTImpl implements WoT.WoTFactory {
    private srv: Servient;

    constructor(srv: Servient) {
        this.srv = srv;
    }

    /** @inheritDoc */
    discover(filter?: WoT.ThingFilter): Observable<WoT.ConsumedThing> {
        return new Observable<ConsumedThing>(subscriber => {
            //find things
            //for each found thing
            //subscriber.next(thing);
            subscriber.complete();
        });
    }


    /** @inheritDoc */
    fetch(url: USVString): Promise<WoT.ThingDescription> {
        return new Promise<WoT.ThingDescription>((resolve, reject) => {
            let client = this.srv.getClientFor(Helpers.extractScheme(url));
            console.info(`WoTImpl consuming TD from ${url} with ${client}`);
            client.readResource(url)
                .then((content) => {
                    if (content.mediaType !== "application/json")
                        console.warn(`WoTImpl parsing TD from '${content.mediaType}' media type`);
                    let tdString : string = content.body.toString();
                    // let td = TDParser.parseTDString(tdString);
                    // let thing = new ConsumedThing(this.srv, td);
                    client.stop();
                    // resolve(thing);
                    resolve(tdString);
                })
                .catch((err) => { console.error(err); });
        });
    }


    /** @inheritDoc */
    consume(td: WoT.ThingDescription): WoT.ConsumedThing {
        // return new Promise<ConsumedThing>((resolve, reject) => {
            // let client = this.srv.getClientFor(Helpers.extractScheme(url));
            // console.info(`WoTImpl consuming TD from ${url} with ${client}`);
            // client.readResource(url)
            //     .then((content) => {
            //         if (content.mediaType !== "application/json")
            //             console.warn(`WoTImpl parsing TD from '${content.mediaType}' media type`);
                    let tdi = TDParser.parseTDString(td);
                    let thing = new ConsumedThing(this.srv, tdi);
                    return thing;
            //        client.stop();
            //        resolve(thing);
                // })
                // .catch((err) => { console.error(err); });
        // });
    }

    /**
     * consume a thing description from an string and return a client representation object
     *
     * @param thingDescription a thing description
     */
    consumeDescription(thingDescription: string): ConsumedThing {
        // return new Promise<ConsumedThing>((resolve, reject) => {
            console.info(`WoTImpl consuming TD from object`);
            let td = TDParser.parseTDString(thingDescription);
            let thing = new ConsumedThing(this.srv, td);
            return thing;
        //     resolve(thing);
        // });
    }

    /**
     * Very hacky way to do an interface type check with Typescript
     * https://stackoverflow.com/questions/14425568/interface-type-check-with-typescript
     */
    isWoTThingDescription(arg: any): arg is WoT.ThingDescription {
        return arg.length !== undefined;
    }
    isWoTThingTemplate(arg: any): arg is WoT.ThingTemplate {
        return arg.name !== undefined;
    }

    /**
     * create a new Thing
     *
     * @param name name/identifier of the thing to be created
     */
    produce(model: WoT.ThingModel): WoT.ExposedThing {
        let td: ThingDescription = null;
        if(this.isWoTThingDescription(model)) {
            let thingDescription : WoT.ThingDescription = model;
            td = TDParser.parseTDString(thingDescription);
        } else if(this.isWoTThingTemplate(model)) {
            let thingTemplate : WoT.ThingTemplate = model;
            console.info(`WoTImpl creating new ExposedThing '${thingTemplate.name}'`);
            td = new ThingDescription();
            td.name = thingTemplate.name;
            // TODO semanticTypes 
            // TODO metadata
        } else {
            throw new Error("WoTImpl could not create Thing because of unknown model argument " + model);
        }
        let mything = new ExposedThing(this.srv, td);
        if (this.srv.addThing(mything)) {
            return mything;
        } else {
            throw new Error("WoTImpl could not create Thing: " + mything);
        }
    }

    // createFromDescription(thingDescription: ThingDescription): ExposedThing {
    //     // return new Promise((resolve, reject) => {
    //         //not necessary to parse if it is already obj
    //         console.info(`WoTImpl creating new ExposedThing from object`);
    //         let myThing = new ExposedThing(this.srv, thingDescription); // thingDescription.name
    //         if (this.srv.addThing(myThing)) {
    //             //add base field
    //             //add actions:
    //             //get the interactions
    //             //for each interaction, add it like event, action or property (first actions)
    //             let interactions: Array<any> = thingDescription.interaction;
    //             for (var i = 0; i < interactions.length; i++) {
    //                 let currentInter = interactions[i];
    //                 let interTypes = currentInter['semanticTypes'];
    //                 if (interTypes.indexOf("Action") > -1) {
    //                     let actionName: string = currentInter.name;
    //                     let inputValueType: Object = null;
    //                     if(currentInter.inputData) {
    //                         inputValueType = currentInter.inputData.valueType;
    //                     }
    //                     let outputValueType: Object = null;
    //                     if( currentInter.outputData) {
    //                         outputValueType = currentInter.outputData.valueType; 
    //                     }
    //                     let init: WoT.ThingActionInit = {
    //                         name : actionName,
    //                         inputDataDescription : JSON.stringify(inputValueType),
    //                         outputDataDescription : JSON.stringify(outputValueType),
    //                         action : undefined
    //                     };
    //                     myThing.addAction(init);
    //                 } else if (interTypes.indexOf("Property") > -1) {
    //                     //maybe there should be more things added?
    //                     let propertyName: string = currentInter.name;
    //                     let outputValueType: Object = currentInter.outputData.valueType;
    //                     let init : WoT.ThingPropertyInit = {
    //                         name : propertyName,
    //                         description : JSON.stringify(outputValueType),
    //                         value : undefined
    //                     };
    //                     myThing.addProperty(init);
    //                 } else if (interTypes.indexOf("Event") > -1) {
    //                     //currently there isnt much implemented that's why I add only the name and nothing else
    //                     let eventName: string = currentInter.name;
    //                     let init : WoT.ThingEventInit = {
    //                         name : eventName
    //                     };
    //                     myThing.addEvent(init);
    //                 } else {
    //                     console.info("Wrong interaction type for number ", i);
    //                 }
    //             }
    //             // resolve(myThing);
    //             return myThing;
    //         } else {
    //             // reject(new Error("WoTImpl could not create Thing from object: " + myThing))
    //             throw new Error("WoTImpl could not create Thing from object: " + myThing);
    //         }
    //     // });
    // }
}
