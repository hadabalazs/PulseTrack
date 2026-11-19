import test from 'node:test';
import assert from 'node:assert/strict';
import { hasEnteredDistance, sessionTapIntent } from '../src/lib/sessionInteractions.js';
test('only an unchecked day adds; completed distance sessions always require confirmation',()=>{
  assert.equal(sessionTapIntent(null),'add');assert.equal(sessionTapIntent({distance:null}),'remove');
  for(const distance of [0,1,2500,'150']) assert.equal(sessionTapIntent({distance}),'confirm');
  assert.equal(sessionTapIntent({distance:null},'1200'),'confirm');assert.equal(sessionTapIntent({distance:1200},''),'remove');
  for(const distance of [null,undefined,'',NaN,Infinity]) assert.equal(hasEnteredDistance({distance}),false);
});
