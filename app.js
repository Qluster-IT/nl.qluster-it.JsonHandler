'use strict';

const Homey = require('homey');
const { Defer } = require('./lib/proto');
const _ = require('lodash');

class MyApp extends Homey.App {
  static get lastName() { return this._lastName; }
  static set lastName(value) { this._lastName = value; }
  /**
   * onInit is called when the app is initialized.
   */
  async onInit() {
    this.log('JsonHandler has been initialized');
    

    try {
      if (process.env.DEBUG === '1') require('inspector').open(9222, '0.0.0.0', false);
    } catch (error) {

    }

    //#region Triggercards

    //#endregion

    //#region Actioncards
    var actions = this.actions = [
      { id: 'action__set__text1_number1_boolean1' },
      { id: 'action__set__text3_number3_boolean3' },
      { id: 'action__set__text5_number5_boolean5' },
      { id: 'action__set__text10_number10_boolean10' },
      { id: 'action__set__json5' },
      { id: 'action__set__json10' },
      
      { id: 'action__get__text1_number1_boolean1' },
      { id: 'action__get__text3_number3_boolean3' },
      { id: 'action__get__text5_number5_boolean5' },
      { id: 'action__get__text10_number10_boolean10' }
    ];
    for (let i = 0; i < actions.length; i++) {
      const action = actions[i];
      const actionCard = this.homey.flow.getActionCard(action.id);
      action.card = actionCard;
      this.setCounts(action);
      
      if(action.id.startsWith('action__set__')) actionCard.registerRunListener(async (args, state) => { //async
        try {
          console.log(action.id + '.registerRunListener args: ');
          console.log(args);
          var returnObject = args.json ? JSON.parse(args.json) : {};
          
          for (let j = 1; j <= action.textCount; j++) this.setJson(returnObject, args['property_text'+j.toString()], args['text'+j.toString()]);// if (args['property_text'+j.toString()] && args['text'+j.toString()]!==undefined) returnObject[args['property_text'+j.toString()]] = args['text'+j.toString()];
          for (let j = 1; j <= action.numberCount; j++) this.setJson(returnObject, args['property_number'+j.toString()], args['number'+j.toString()]);// if (args['property_number'+j.toString()] && args['number'+j.toString()]!==undefined) returnObject[args['property_number'+j.toString()]] = args['number'+j.toString()];
          for (let j = 1; j <= action.booleanCount; j++) this.setJson(returnObject, args['property_boolean'+j.toString()], args['boolean'+j.toString()]);// if (args['property_boolean'+j.toString()] && args['boolean'+j.toString()]!==undefined) returnObject[args['property_boolean'+j.toString()]] = args['boolean'+j.toString()];
          for (let j = 1; j <= action.jsonCount; j++) if(args['json'+j.toString()]) this.setJson(returnObject, args['property_json'+j.toString()], JSON.parse(args['json'+j.toString()]));// if (args['property_boolean'+j.toString()] && args['boolean'+j.toString()]!==undefined) returnObject[args['property_boolean'+j.toString()]] = args['boolean'+j.toString()];

          return {json:JSON.stringify(returnObject)};
          
        } catch (error) {
          console.log('Error: ' + error);
          throw error;
        }
      });
      else if(action.id.startsWith('action__get__')) actionCard.registerRunListener(async (args, state) => { //async
        try {
          console.log(action.id + '.registerRunListener args: ');
          console.log(args);
          let json = JSON.parse(args.json);
          var returnObject = {};

          for (let j = 1; j <= action.textCount; j++) returnObject['text'+j.toString()] = this.getJsonValue(json, args['property_text'+j.toString()], ' ');
          for (let j = 1; j <= action.numberCount; j++) returnObject['number'+j.toString()] = this.getJsonValue(json, args['property_number'+j.toString()], 0);
          for (let j = 1; j <= action.booleanCount; j++) returnObject['boolean'+j.toString()] = this.getJsonValue(json, args['property_boolean'+j.toString()], false);
          
          return returnObject;
          
        } catch (error) {
          console.log('Error: ' + error);
          throw error;
        }
      });
    }

    //#endregion
  }


  setCounts(card) {
    card.textCount = card.numberCount = card.booleanCount = card.jsonCount = 0;
      var arrArgumentTypes = _.last(card.id.split('__')).split('_');
      for (let i = 0; i < arrArgumentTypes.length; i++) {
        const type = arrArgumentTypes[i];
        if(type.startsWith('text')) card.textCount = Number.parseInt(type.replace('text',''));
        else if(type.startsWith('number')) card.numberCount = Number.parseInt(type.replace('number',''));
        else if(type.startsWith('boolean')) card.booleanCount = Number.parseInt(type.replace('boolean',''));    
        else if(type.startsWith('json')) card.jsonCount = Number.parseInt(type.replace('json',''));    
      }
  }

  getJsonValue(json, path, retur) {
    if((json===undefined || json===null) || (path===undefined || path===null)) return retur;
    let paths = path.split('.');
    var activeObj = json;
    for (let i = 0; i < paths.length; i++) {
      if(i==paths.length-1) return activeObj[paths[i]];
      else if (activeObj[paths[i]]) {
        activeObj = activeObj[paths[i]];
      } else return retur;
    }
    return retur;
  }

  setJson(json, path, value) {
    if((json===undefined || json===null) || (path===undefined || path===null) || (value===undefined || value===null)) return;
    let paths = path.split('.');
    var activeObj = json;
    for (let i = 0; i < paths.length; i++) {
      if(i==paths.length-1) activeObj[paths[i]] = value;
      else if (!activeObj[paths[i]]) {
        activeObj[paths[i]] = {};
        activeObj = activeObj[paths[i]];
      }
    }
  }


}

module.exports = MyApp;
