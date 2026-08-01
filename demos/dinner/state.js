/* 今天吃什么 — 语言无关持久层与 food_state_v1 迁移。 */
(function(root, factory){
  const api = factory();
  if(typeof module === 'object' && module.exports) module.exports = api;
  if(root) root.FOOD_STATE = api;
})(typeof window !== 'undefined' ? window : globalThis, function(){
  'use strict';

  const SCHEMA_VERSION = 2;

  function text(v){ return v == null ? '' : String(v).trim(); }
  function count(v){ const n = Math.round(Number(v)); return Number.isFinite(n) && n > 0 ? n : 1; }
  function days(v){ const n = Number(v); return Number.isFinite(n) && n >= 0 ? n : 0; }
  function sameText(a,b){ return text(a).toLocaleLowerCase() === text(b).toLocaleLowerCase(); }

  function findKeyByName(name, food){
    const needle = text(name);
    if(!needle) return null;
    const names = food.ING_NAMES || {};
    const keys = Object.keys(names);
    for(const key of keys){
      const pair = names[key] || {};
      if(sameText(needle, pair.zh) || sameText(needle, pair.en)) return key;
    }
    const low = needle.toLocaleLowerCase();
    for(const key of keys){
      const pair = names[key] || {};
      const zh = text(pair.zh), en = text(pair.en).toLocaleLowerCase();
      if((zh && needle.indexOf(zh) >= 0) || (en && low.indexOf(en) >= 0)) return key;
    }
    return null;
  }

  function findUnitCode(unit, food){
    const value = text(unit);
    if(!value) return null;
    const table = food.UNIT_TEXT || {};
    for(const code of Object.keys(table)){
      const pair = table[code] || {};
      if(sameText(value, pair.zh) || sameText(value, pair.en)) return code;
    }
    return null;
  }

  function cleanFridgeItem(old, food){
    old = old && typeof old === 'object' ? old : {};
    const suppliedName = text(old.rawName || old.name || old.label);
    const knownKey = food.ING && food.ING[old.key] ? old.key : findKeyByName(suppliedName, food);
    const out = { n:count(old.n), days:days(old.days) };
    if(knownKey) out.key = knownKey;
    else out.rawName = suppliedName || text(old.key);
    if(old.staple) out.staple = true;

    if(old.unitCode && food.UNIT_TEXT && food.UNIT_TEXT[old.unitCode]) out.unitCode = old.unitCode;
    else {
      const code = findUnitCode(old.unit || old.rawUnit, food);
      if(code) out.unitCode = code;
      else if(text(old.rawUnit || old.unit)) out.rawUnit = text(old.rawUnit || old.unit);
    }
    return out;
  }

  function cleanShoppingItem(old, food){
    old = typeof old === 'string' ? {name:old} : (old && typeof old === 'object' ? old : {});
    const suppliedName = text(old.rawName || old.name || old.label);
    const knownKey = food.ING && food.ING[old.key] ? old.key : findKeyByName(suppliedName, food);
    if(knownKey) return { key:knownKey, n:count(old.n) };
    return { rawName:suppliedName || text(old.key), rawCat:text(old.rawCat || old.cat) || '其他', n:count(old.n) };
  }

  function mergeShopping(items){
    const out = [];
    items.forEach(item=>{
      if(!item.key && !item.rawName) return;
      const existing = out.find(x=> item.key ? x.key===item.key : (!x.key && x.rawName===item.rawName && x.rawCat===item.rawCat));
      if(existing) existing.n += item.n;
      else out.push(item);
    });
    return out;
  }

  function migrate(raw, food){
    if(!raw || typeof raw !== 'object') return null;
    const next = Object.assign({}, raw, {
      schema:SCHEMA_VERSION,
      fridge:Array.isArray(raw.fridge) ? raw.fridge.map(x=>cleanFridgeItem(x, food)).filter(x=>x.key || x.rawName) : [],
      shopping:mergeShopping((Array.isArray(raw.shopping) ? raw.shopping : []).map(x=>cleanShoppingItem(x, food))),
      saved:raw.saved && typeof raw.saved === 'object' ? raw.saved : {yuan:86, kg:3.2},
    });
    return next;
  }

  function fresh(food){
    return {
      schema:SCHEMA_VERSION,
      fridge:(food.FRIDGE_SEED || []).map(x=>cleanFridgeItem(x, food)),
      shopping:[], saved:{yuan:86, kg:3.2}, mode:'tonight', seen:true,
    };
  }

  function save(storage, storeKey, value){
    storage.setItem(storeKey, JSON.stringify(value));
  }

  function load(storage, storeKey, food){
    const json = storage.getItem(storeKey);
    if(!json) return null;
    const raw = JSON.parse(json);
    const next = migrate(raw, food);
    if(next && JSON.stringify(raw)!==JSON.stringify(next)) save(storage, storeKey, next); // 旧结构只迁移写回一次
    return next;
  }

  function addToShopping(state, items, food){
    const incoming = (items || []).map(x=>cleanShoppingItem(x, food));
    incoming.forEach(item=>{
      if(!item.key && !item.rawName) return;
      const existing = state.shopping.find(x=> item.key ? x.key===item.key : (!x.key && x.rawName===item.rawName && x.rawCat===item.rawCat));
      if(existing) existing.n += 1;
      else state.shopping.push(Object.assign({}, item, {n:1}));
    });
    return state.shopping;
  }

  function buyItem(state, item){
    const amount = count(item && item.n);
    let fridgeItem;
    if(item && item.key){
      fridgeItem = state.fridge.find(x=>x.key===item.key);
      if(fridgeItem){ fridgeItem.n += amount; fridgeItem.days=0; fridgeItem.unitCode='bought'; delete fridgeItem.rawUnit; }
      else state.fridge.push({key:item.key, n:amount, unitCode:'bought', days:0});
    }else if(item && item.rawName){
      fridgeItem = state.fridge.find(x=>!x.key && x.rawName===item.rawName);
      if(fridgeItem){ fridgeItem.n += amount; fridgeItem.days=0; fridgeItem.unitCode='bought'; delete fridgeItem.rawUnit; }
      else state.fridge.push({rawName:item.rawName, rawCat:item.rawCat||'其他', n:amount, unitCode:'bought', days:0});
    }else return false;
    state.shopping = state.shopping.filter(x=>x!==item);
    return true;
  }

  function ingredientName(item, food, lang){
    if(item && item.key){
      const pair = (food.ING_NAMES || {})[item.key];
      if(pair) return lang === 'en' ? pair.en : pair.zh;
      const meta = food.ING && food.ING[item.key];
      if(meta) return meta.label;
    }
    return text(item && item.rawName);
  }

  function unitText(item, food, lang){
    const pair = item && item.unitCode && food.UNIT_TEXT && food.UNIT_TEXT[item.unitCode];
    if(pair) return lang === 'en' ? pair.en : pair.zh;
    return text(item && item.rawUnit) || ('×'+count(item && item.n));
  }

  function shoppingName(item, food, lang){ return ingredientName(item, food, lang); }
  function shoppingCat(item, food){
    const cat = item && item.key && food.ING && food.ING[item.key]
      ? food.ING[item.key].cat : (text(item && item.rawCat) || '其他');
    return ['蔬菜','蛋白','肉蛋','主食','调料'].includes(cat) ? cat : '其他';
  }

  return {
    SCHEMA_VERSION, findKeyByName, migrate, fresh, load, save,
    addToShopping, buyItem, ingredientName, unitText, shoppingName, shoppingCat,
  };
});
