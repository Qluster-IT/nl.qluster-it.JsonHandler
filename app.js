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
    this.lastName = null;
    this.uniqueId = 0;
    

    // try {
    //   if (process.env.DEBUG === '1') require('inspector').open(9222, '0.0.0.0', false);
    // } catch (error) {

    // }

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



    //#region Triggercards Looper
    var triggersLoop = this.triggers = [
      { id: 'trigger__loop__text1' }
    ];
    for (let i = 0; i < triggersLoop.length; i++) {
      const trigger = triggersLoop[i];
      const triggerCard = this.homey.flow.getTriggerCard(trigger.id);
      trigger.card = triggerCard;
      this.setCounts(trigger);

      triggerCard.registerRunListener(async (args, state, more) => { //async
        let s = 'trigger__loop__text' + state.textCount + (state.numberCount ? '_number' + state.numberCount : '') + (state.booleanCount? '_boolean' + state.booleanCount : '');
        return args.name.name==state.name.name && (trigger.id.startsWith(s) || args.overloadable == 'true');        
      });
      triggerCard.getArgument('name').registerAutocompleteListener(async (query, args) => {
        try {
          trigger.lastName = query;
          return await this.getEventNames({ targetCard: trigger.actionCard, query: query, args: args });
        } catch (error) { this.error('trigger.name.registerAutocompleteListener.error :', error); throw error; }
      });

      triggerCard.on("update", async () => { await this.setTrigger(trigger); });
      await this.setTrigger(trigger);
    }
    //#endregion

    //#region Actioncards Looper
    var actionsLoop = this.actions = [
      { id: 'action__loop__text1' }
    ];
    for (let i = 0; i < actionsLoop.length; i++) {
      const action = actionsLoop[i];
      const actionCard = this.homey.flow.getActionCard(action.id);
      action.card = actionCard;
      this.setCounts(action);
      var triggername = action.id.replace('action_', 'trigger_');
      action.triggerCard = _.find(triggersLoop, x => { return x.id == triggername; });
      action.triggerCard.actionCard = action;
      actionCard.registerRunListener(async (args, state, more) => { //async
        var defer = new Defer();
        try {
          //console.log(action.id + '.registerRunListener args: ');
          //console.log(args);
          let newArgs = { name: args.name || { name: args.namebytag } };
          delete args.name;

            if (!this.returns) this.returns = {};
            if (!this.returns[newArgs.name.name]) this.returns[newArgs.name.name] = { count: 0, list: {} };
            args.flowexecutionid = this.returns[newArgs.name.name].count += 1;
            let recievedTokens;
            if (args.waittofinish !== false) {
              this.returns[newArgs.name.name].list[this.returns[newArgs.name.name].count] = new Defer();
              this.returns[newArgs.name.name].list[this.returns[newArgs.name.name].count].then(x => { if (recievedTokens === undefined) recievedTokens = x; });

            }
            const event = action.triggerCard.events[newArgs.name.name];
            if (event && event.debounce==='sequential') {
              if (!event.promises) event.promises = [];
            }
            var promises = [];
            var triggerCards = _.filter(this.triggers, x => { return !x.deprecated && x.textCount >= action.triggerCard.textCount && x.numberCount >= action.triggerCard.numberCount && x.booleanCount >= action.triggerCard.booleanCount; });
            let loop = JSON.parse(args.loop);
            let loopIsArray = _.isArray(loop);
            
            let previousPromise = null;
            const fc = async (val, key, triggerCard)=>{
              args.loopvaluestring = '';
              args.loopvaluenumber = -1;
              args.loopvalueboolean = false;
              switch (typeof(val)) {
                case 'string':args.loopvaluestring = val; break;
                case 'number':args.loopvaluenumber = val; break;
                case 'boolean':args.loopvalueboolean = val; break;
                default: args.loopvaluestring = JSON.stringify(val);
              }  
              args.loopkey = !loopIsArray ? key : key.toString();
              args.loopindex =loopIsArray? key : -1;
              if(previousPromise) await previousPromise;
              const p = triggerCard.card.trigger(args, { name: newArgs.name, textCount: action.textCount, numberCount: action.numberCount, booleanCount: action.booleanCount, uniqueId: this.uniqueId++ });
              previousPromise = p;

              promises.push(p);
              if (event && event.promises) {
                if(!event.promises[triggerCard.id]) event.promises[triggerCard.id] = [];
                event.promises[triggerCard.id].push(p);
                p.then(()=> {event.promises[triggerCard.id].shift(); }).catch(()=> { event.promises[triggerCard.id].shift();} );              
              }
            };
            for (let i = 0; i < triggerCards.length; i++) {
              const triggerCard = triggerCards[i];
              for (let j = 1; j <= triggerCard.textCount; j++) if (args['text' + j.toString()] === undefined) args['text' + j.toString()] = "";
              for (let j = 1; j <= triggerCard.numberCount; j++) if (args['number' + j.toString()] === undefined) args['number' + j.toString()] = 0;
              for (let j = 1; j <= triggerCard.booleanCount; j++) if (args['boolean' + j.toString()] === undefined) args['boolean' + j.toString()] = false;
              
              if(_.isArray(loop)) for (let i = 0; i < loop.length; i++) {
                const element = loop[i];
                await fc(element, i, triggerCard);
              } else if(_.isObject(loop)) 
              for (const key in loop) {
                if (Object.hasOwnProperty.call(loop, key)) {
                  const element = loop[key];
                  await fc(element, key, triggerCard);                  
                }
              }
            }
            let tokens = {};
            // for (let j = 1; j <= 10; j++) if (tokens['text' + j.toString()] === undefined) tokens['text' + j.toString()] = "";
            // for (let j = 1; j <= 10; j++) if (tokens['number' + j.toString()] === undefined) tokens['number' + j.toString()] = 0;
            // for (let j = 1; j <= 10; j++) if (tokens['boolean' + j.toString()] === undefined) tokens['boolean' + j.toString()] = false;

            if (args.waittofinish === false) {
              defer.resolve(tokens);
              delete this.returns[newArgs.name.name].list[this.returns[newArgs.name.name].count];
            }
            else {
              Promise.all(promises)
                .then(x => {
                  let a = recievedTokens;
                  defer.resolve(recievedTokens || tokens);
                  delete this.returns[newArgs.name.name].list[this.returns[newArgs.name.name].count];
                })
                .catch(err => {
                  defer.reject(err);
                  delete this.returns[newArgs.name.name].list[this.returns[newArgs.name.name].count];
                });
            }
        } catch (error) {
          console.log('Error: ' + error);
          defer.reject(error);
        }
        return defer.promise;
      });

      actionCard.getArgument('name').registerAutocompleteListener(async (query, args) => {
        try {
          action.lastName = query;
          return await this.getEventNames({ targetCard: action.triggerCard, query: query, args: args, isAction: true });
        } catch (error) { this.error('trigger.name.registerAutocompleteListener.error :', error); throw error; }
      });

      actionCard.on("update", async () => {
        this.setArgumentValues(action, actionCard);
      });
      this.setArgumentValues(action, actionCard);
    }

    //#endregion
  }


  sleep(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }

  getJsonValue(json, path, _default) {
    if(!path) return _default;
    try {
      let jsonObject = json;// JSON.parse(json);
      return eval('jsonObject.' + path);
  
    }catch (ex) {
      console.log(ex);
      return _default;
    }
  }

  setJson(json, path, value) {
    if((json===undefined || json===null) || (path===undefined || path===null || path==='') || (value===undefined || value===null)) return;
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



  //#region Functions the same as AdvancedTriggers
  
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


  async setArgumentValues(cardObject, cardCard) {
    cardObject.argumentValues = await cardCard.getArgumentValues();
  }

  async setTrigger(trigger) {
    await this.setArgumentValues(trigger, trigger.card);
    if (!trigger.events) trigger.events = {};
    trigger.events = {};

    for (let i = 0; i < trigger.argumentValues.length; i++) {
      const argumentValue = trigger.argumentValues[i];
      if (!trigger.events[argumentValue.name.name]) trigger.events[argumentValue.name.name] = { name: argumentValue.name.name, arguments: [argumentValue], debounce: argumentValue.debounce};
      else {
        var event = trigger.events[argumentValue.name.name];
        if (argumentValue.debounce && argumentValue.debounce != 'none') {
          if (event.debounce); //ALERT that this will not work correctly.
          event.debounce = argumentValue.debounce;
        }
        event.arguments.push(argumentValue);
      }
    }
  }

  async getEventNames({ targetCard, query, args, isAction = false } = {}) {
    var _return = query && query != '' && query.trim() != '' ? [{ name: query, description: this.homey.__("return_description_create") }] : [];
    var cards = [];
    if (isAction) cards = _.filter(this.triggers, x => { return !x.deprecated && x.textCount >= targetCard.textCount && x.numberCount >= targetCard.numberCount && x.booleanCount >= targetCard.booleanCount; });
    else if (!isAction && args.overloadable == 'true') cards = _.filter(this.actions, x => { return !x.deprecated && x.textCount <= targetCard.textCount && x.numberCount <= targetCard.numberCount && x.booleanCount <= targetCard.booleanCount; });
    else cards.push(targetCard);
    for (let iCards = 0; iCards < cards.length; iCards++) {
      const card = cards[iCards];
      if (card.lastName && (!isAction || card == targetCard)) {
        var o = null;
        if (!(o = _.find(_return, x => { return x.name == card.lastName; }))) _return.push({ name: card.lastName, description: this.homey.__("return_description_select") });
        else o.description = this.homey.__("return_description_select");
      }
    }
    for (let iCards = 0; iCards < cards.length; iCards++) {
      const card = cards[iCards];
      for (let i = 0; i < card.argumentValues.length; i++) {
        const element = card.argumentValues[i];
        if (!element.name) continue;
        if (isAction && (card.textCount > targetCard.textCount || card.numberCount > targetCard.numberCount || card.booleanCount > targetCard.booleanCount) && element.overloadable != 'true') continue;
        else if (!isAction && (card.textCount < targetCard.textCount || card.numberCount < targetCard.numberCount || card.booleanCount < targetCard.booleanCount) && (!args || args.overloadable != 'true')) continue;
        if (query && query != '') {
          if (element.name.name.indexOf(query) > -1) {
            let o = null;
            if (!(o = _.find(_return, x => { return x.name == element.name.name; })))
              _return.push({ name: element.name.name, description: this.homey.__("return_description_select") });
            else o.description = this.homey.__("return_description_select");
          }
        }
        else {
          let o = null;
          if (!(o = _.find(_return, x => { return x.name == element.name.name; })))
            _return.push({ name: element.name.name, description: this.homey.__("return_description_select") });
          else o.description = this.homey.__("return_description_select");
          //if(!_.find(_return, x=>{return x.name==element.name.name;})) _return.push({ name: element.name.name, description:this.homey.__("return_description_select") });
        }
      }
    }
    return _return;
  }
  //#endregion

}

module.exports = MyApp;
