import test from 'node:test';
import assert from 'node:assert/strict';
import { discoverySections } from '../src/lib/discovery.mjs';
const store = (name, rating, count, extra={}) => ({name,rating,review_count:count,verification_status:'VERIFIED',...extra});
test('rankings use published review counts and scores, without fabricated positions', () => {
  const rows=[store('Loja A',4.5,20,{featured:true}),store('Loja B',5,2),store('Loja C',4.8,20),store('Loja D',null,0),store('Loja E',5,100,{verification_status:'PENDING'})];
  const result=discoverySections(rows);
  assert.deepEqual(result.topReviewed.map(x=>x.name),['Loja C','Loja A','Loja B']);
  assert.deepEqual(result.bestRated.map(x=>x.name),['Loja B','Loja C','Loja A']);
  assert.deepEqual(result.featured.map(x=>x.name),['Loja A']);
  assert.equal(rows[0].name,'Loja A');
});
test('empty, missing and invalid ratings do not create a ranking',()=>{
  assert.deepEqual(discoverySections([]),{featured:[],topReviewed:[],bestRated:[]});
  assert.equal(discoverySections([store('Sem nota',null,0),store('Inválida',9,100),store('Sem reviews',5,0)]).topReviewed.length,0);
});
