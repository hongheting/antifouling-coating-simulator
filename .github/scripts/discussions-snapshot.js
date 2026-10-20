#!/usr/bin/env node
// Snapshot of GitHub Discussions (技术交流 categories) → JSON for anonymous reading in the app.
// Output only changes when content changes (generated_at is kept if discussions are identical).
'use strict';
const fs = require('fs');
const out = process.argv[2] || 'public-data/discussions.json';
const [owner, name] = (process.env.REPO || 'hongheting/antifouling-coating-simulator').split('/');
const SLUGS = ['新技术-new-technology', '新配方-new-formulation', '新工艺-new-process'];
const PER_CAT = 50, COMMENTS = 50;

const QUERY = `query($o:String!,$n:String!,$c:ID!,$first:Int!,$cm:Int!){repository(owner:$o,name:$n){
  discussions(first:$first,categoryId:$c,orderBy:{field:CREATED_AT,direction:DESC}){nodes{
    id number title url createdAt updatedAt body bodyHTML bodyText
    author{login avatarUrl} category{slug name}
    comments(first:$cm){totalCount nodes{id createdAt url body bodyHTML author{login avatarUrl}}}}}}}`;
const CATQ = `query($o:String!,$n:String!){repository(owner:$o,name:$n){discussionCategories(first:25){nodes{id slug name}}}}`;

async function gql(query, variables) {
  const r = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: { Authorization: 'bearer ' + process.env.GITHUB_TOKEN, 'Content-Type': 'application/json', 'User-Agent': 'discussions-snapshot' },
    body: JSON.stringify({ query, variables }),
  });
  const j = await r.json();
  if (!r.ok || j.errors) throw new Error('GraphQL: ' + r.status + ' ' + JSON.stringify(j.errors || j));
  return j.data;
}

async function main() {
  if (!process.env.GITHUB_TOKEN) { console.error('GITHUB_TOKEN not set; skipping'); process.exit(2); }
  const cats = (await gql(CATQ, { o: owner, n: name })).repository.discussionCategories.nodes.filter(c => SLUGS.includes(c.slug));
  let discussions = [];
  for (const c of cats) {
    const d = await gql(QUERY, { o: owner, n: name, c: c.id, first: PER_CAT, cm: COMMENTS });
    discussions = discussions.concat(d.repository.discussions.nodes);
  }
  discussions.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  const doc = { schema: 1, repo: owner + '/' + name, generated_at: new Date().toISOString(),
    categories: cats.map(c => ({ slug: c.slug, name: c.name })), discussions,
    note: '作者自述，未经验证 / Self-reported by authors, not verified.' };
  try {
    const old = JSON.parse(fs.readFileSync(out, 'utf8'));
    if (JSON.stringify(old.discussions) === JSON.stringify(doc.discussions) && JSON.stringify(old.categories) === JSON.stringify(doc.categories)) {
      console.log('unchanged (' + discussions.length + ' discussions)'); return;
    }
  } catch (e) { /* first run */ }
  fs.writeFileSync(out, JSON.stringify(doc, null, 1) + '\n');
  console.log('wrote ' + out + ': ' + discussions.length + ' discussions in ' + cats.length + ' categories');
}
main().catch(e => { console.error(e); process.exit(1); });
