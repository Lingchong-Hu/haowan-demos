'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const State = require('./state.js');

const STORE = 'food_state_v1';

class MockLocalStorage {
  constructor(){ this.map = new Map(); }
  getItem(key){ return this.map.has(key) ? this.map.get(key) : null; }
  setItem(key, value){ this.map.set(key, String(value)); }
  removeItem(key){ this.map.delete(key); }
}

function loadFood(lang){
  const source = fs.readFileSync(path.join(__dirname, 'data.js'), 'utf8');
  const context = {
    window:{},
    GG:{T:(zh,en)=>lang === 'en' ? en : zh},
  };
  vm.createContext(context);
  vm.runInContext(source, context, {filename:'data.js'});
  return context.window.FOOD;
}

const foodZh = loadFood('zh');
const foodEn = loadFood('en');

function legacyFresh(lang){
  const food = lang === 'en' ? foodEn : foodZh;
  return {
    fridge:food.FRIDGE_SEED.map(item=>{
      const old = {
        key:item.key, n:item.n, unit:food.UNIT_TEXT[item.unitCode][lang], days:item.days,
      };
      if(item.staple) old.staple = true;
      return old;
    }),
    shopping:[], saved:{yuan:86,kg:3.2}, mode:'tonight', seen:true,
  };
}

function persisted(storage){ return JSON.parse(storage.getItem(STORE)); }

/* a) 中文旧会话 → 英文迁移 → 买到回填；再反向走一轮，验证任意切换。 */
{
  const storage = new MockLocalStorage();
  const old = legacyFresh('zh');
  old.shopping.push({name:'番茄', cat:'蔬菜', n:1});
  storage.setItem(STORE, JSON.stringify(old));

  let state = State.load(storage, STORE, foodEn);
  assert.strictEqual(state.schema, 2);
  assert.deepStrictEqual(state.shopping, [{key:'tomato',n:1}]);
  assert.strictEqual(State.shoppingName(state.shopping[0], foodEn, 'en'), 'Tomato');
  assert.strictEqual(State.unitText(state.fridge.find(x=>x.key==='spinach'), foodEn, 'en'), '1 bunch');
  assert.ok(state.fridge.every(x=>!x.key || (!Object.hasOwn(x,'unit') && !Object.hasOwn(x,'rawUnit'))));
  State.buyItem(state, state.shopping[0]);
  State.save(storage, STORE, state);
  assert.strictEqual(state.fridge.find(x=>x.key==='tomato').n, 4);
  assert.strictEqual(state.shopping.length, 0);

  State.addToShopping(state, [{name:'Tomato'}], foodEn);
  State.save(storage, STORE, state);
  state = State.load(storage, STORE, foodZh);
  assert.strictEqual(State.shoppingName(state.shopping[0], foodZh, 'zh'), '番茄');
  State.buyItem(state, state.shopping[0]);
  assert.strictEqual(state.fridge.find(x=>x.key==='tomato').n, 5);
  assert.strictEqual(state.shopping.length, 0);
  console.log('PASS a: zh→en→zh 已知食材始终按 key 回填，番茄库存 3→4→5，清单归零');
}

/* b) 两张表都不认识的旧 name 必须原文保留，并按原文回填。 */
{
  const storage = new MockLocalStorage();
  const old = legacyFresh('zh');
  old.shopping.push({name:'火星菜', cat:'蔬菜', n:2});
  storage.setItem(STORE, JSON.stringify(old));

  const state = State.load(storage, STORE, foodEn);
  assert.deepStrictEqual(state.shopping, [{rawName:'火星菜',rawCat:'蔬菜',n:2}]);
  assert.strictEqual(State.shoppingName(state.shopping[0], foodEn, 'en'), '火星菜');
  State.buyItem(state, state.shopping[0]);
  const raw = state.fridge.find(x=>!x.key && x.rawName==='火星菜');
  assert.ok(raw);
  assert.strictEqual(raw.n, 2);
  assert.strictEqual(State.ingredientName(raw, foodEn, 'en'), '火星菜');
  assert.strictEqual(state.shopping.length, 0);
  console.log('PASS b: 未知旧项“火星菜”迁移后原文可见，买到后原文回填 2 份，清单归零');
}

/* c) 全新中文状态的展示与修复前关键快照一致，已知食材闭环行为不变。 */
{
  const storage = new MockLocalStorage();
  let state = State.fresh(foodZh);
  State.save(storage, STORE, state);
  state = State.load(storage, STORE, foodZh);
  const snapshot = state.fridge.map(x=>[
    x.key, x.n, State.unitText(x, foodZh, 'zh'), x.days, !!x.staple,
  ]);
  assert.deepStrictEqual(snapshot, [
    ['spinach',1,'1 把',3,false], ['mushroom',1,'1 盒',3,false], ['milk',1,'剩 ~30%',6,false],
    ['tomato',3,'3 个',5,false], ['tofu',1,'1 盒',2,false], ['chicken',1,'1 块',1,false],
    ['rice',1,'剩一碗',1,false], ['egg',5,'5 个',4,false], ['pepper',2,'2 个',2,false],
    ['carrot',2,'2 根',5,false], ['cucumber',2,'2 根',2,false], ['scallion',1,'一小把',3,true],
    ['garlic',1,'一头',6,true], ['ginger',1,'一块',6,true], ['oil',1,'一瓶',8,true],
    ['salt',1,'一罐',8,true], ['soy',1,'一瓶',8,true], ['sugar',1,'一罐',8,true],
    ['vinegar',1,'一瓶',8,true],
  ]);
  State.addToShopping(state, [{name:'土豆',cat:'蔬菜'}], foodZh);
  assert.deepStrictEqual(state.shopping, [{key:'potato',n:1}]);
  State.buyItem(state, state.shopping[0]);
  const potato = state.fridge.find(x=>x.key==='potato');
  assert.deepStrictEqual(
    [potato.key,potato.n,State.unitText(potato,foodZh,'zh'),potato.days,state.shopping.length],
    ['potato',1,'新买',0,0]
  );
  assert.strictEqual(persisted(storage).schema, 2);
  console.log('PASS c: 全新中文 19 项库存展示快照不变；土豆加入→买到→“新买”回填行为等价');
}

console.log('PASS all: dinner food_state_v1 schema v2 migration and purchase loop');
