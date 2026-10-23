import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {reservedStoreSlugs} from '../src/lib/store-path.mjs';

test('catalog rewrites keep platform routes and React assets on their own deployment',()=>{
 const config=fs.readFileSync(new URL('../netlify.toml',import.meta.url),'utf8');
 const blocks=config.split('[[redirects]]').slice(1).map(b=>b.split('[[headers]]')[0]);
 const rules=blocks.map(b=>({from:/from = "([^"]+)"/.exec(b)?.[1],to:/to = "([^"]+)"/.exec(b)?.[1],status:Number(/status = (\d+)/.exec(b)?.[1]),force:/force = true/.test(b)}));
 const catalog=rules.findIndex(r=>r.from==='/:slug');assert.ok(catalog>0);
 for(const slug of reservedStoreSlugs){const i=rules.findIndex(r=>r.from==='/'+slug);assert.ok(i>=0&&i<catalog,slug);assert.equal(rules[i].to,'/index.html');}
 assert.equal(rules[catalog].status,200);assert.equal(rules[catalog].to,'https://gestao.norieco.com.br/index.html');
 const assets=rules.find(r=>r.from==='/assets/*');assert.equal(assets.force,false,'React assets must never be shadowed');
 for(const path of ['/main.dart.js','/flutter_bootstrap.js','/assets/*','/icons/*'])assert.ok(rules.findIndex(r=>r.from===path)<catalog);
 assert.ok(rules.findIndex(r=>r.from==='/*')>catalog,'SPA fallback hides the catalog');
});
