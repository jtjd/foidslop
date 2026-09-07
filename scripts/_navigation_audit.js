#!/usr/bin/env node
const fs=require('fs'),path=require('path');
const ROOT=process.cwd();
const skip=new Set(['.git','node_modules','.deploy']);
function walk(dir,out=[]){for(const e of fs.readdirSync(dir,{withFileTypes:true})){if(skip.has(e.name))continue;const p=path.join(dir,e.name);if(e.isDirectory())walk(p,out);else if(e.name.endsWith('.html'))out.push(p);}return out;}
const files=walk(ROOT);
const redirects=new Set();
if(fs.existsSync('_redirects'))for(const raw of fs.readFileSync('_redirects','utf8').split(/\r?\n/)){const line=raw.trim();if(!line||line.startsWith('#'))continue;const [src]=line.split(/\s+/);if(src&&!src.includes('*'))redirects.add(src.replace(/\.html$/,''));}
const routeExists=p=>{if(p==='/'||p==='')return true;const clean=p.replace(/\/+$/,'');return fs.existsSync(path.join(ROOT,clean.slice(1)+'.html'))||fs.existsSync(path.join(ROOT,clean.slice(1),'index.html'))||redirects.has(clean);};
const strip=s=>s.replace(/<[^>]*>/g,' ').replace(/&[^;]+;/g,' ').replace(/\s+/g,' ').trim();
const norm=(href,file)=>{if(!href||href.startsWith('#')||/^(?:mailto:|tel:|javascript:)/i.test(href))return null;try{if(/^https?:\/\//i.test(href)){const u=new URL(href);if(u.hostname!=='foidslop.com'&&u.hostname!=='www.foidslop.com')return null;href=u.pathname+u.search+u.hash;}}catch{return null;}const q=href.split(/[?#]/)[0];if(!q)return null;let p;if(q.startsWith('/'))p=q;else{const base='/'+path.relative(ROOT,path.dirname(file)).replace(/\\/g,'/');p=path.posix.normalize(path.posix.join(base,q));if(!p.startsWith('/'))p='/'+p;}return p.replace(/\/index\.html$/,'/').replace(/\.html$/,'');};
const headerSets=new Map(),footerSets=new Map(),broken=[],stale=[],mobile=[],noHeader=[];
for(const file of files){const rel=path.relative(ROOT,file).replace(/\\/g,'/'),html=fs.readFileSync(file,'utf8');const h=html.match(/<header[^>]*class="[^"]*site-header[^"]*"[\s\S]*?<\/header>/i);if(h){const links=[...h[0].matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi)].map(m=>strip(m[2])).filter(Boolean);const key=links.join(' | ');headerSets.set(key,(headerSets.get(key)||[]).concat(rel));if(!/nav-hamburger/.test(h[0])||!/nav-dropdown/.test(h[0]))mobile.push(rel);}else if(!/check-inbox|404/.test(rel))noHeader.push(rel);
const f=html.match(/<footer[\s\S]*?<\/footer>/i);if(f){const links=[...f[0].matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi)].map(m=>strip(m[2])).filter(Boolean);const key=links.join(' | ');footerSets.set(key,(footerSets.get(key)||[]).concat(rel));}
for(const m of html.matchAll(/\bhref="([^"]+)"/gi)){const href=m[1];if(/culture\/is-it-foidslop\?item=/.test(href)||/culture\/is-it-foidslop\.html/.test(href))stale.push({file:rel,href});if(/\.html(?:[?#]|$)/.test(href)&&!/^https?:/.test(href))stale.push({file:rel,href});const p=norm(href,file);if(p&&!/\.[a-z0-9]{2,5}$/i.test(p)&&!routeExists(p))broken.push({file:rel,href,resolved:p});}
}
function summarize(map){return [...map.entries()].sort((a,b)=>b[1].length-a[1].length).map(([links,pages])=>({count:pages.length,links,pages:pages.slice(0,20)}));}
const report={htmlFiles:files.length,headerVariants:summarize(headerSets),footerVariants:summarize(footerSets),headersMissingMobileControls:mobile.length,pagesMissingMobileControls:mobile.slice(0,80),pagesWithoutSiteHeader:noHeader.slice(0,80),staleLinks:stale,brokenLinks:broken.slice(0,200)};
console.log(JSON.stringify(report,null,2));
if(broken.length||stale.length||mobile.length)process.exitCode=2;
