// IT Live — noutbuk nazorati serveri (qo‘shimcha kutubxonasiz, Node.js 18+)
const http=require('http'),fs=require('fs'),path=require('path'),crypto=require('crypto');
const PORT=process.env.PORT||3000,DIR=process.env.DATA_DIR||path.join(__dirname,'data'),PUB=path.join(__dirname,'public');
fs.mkdirSync(DIR,{recursive:true});
const F=n=>path.join(DIR,n);
const rd=(n,d)=>{try{return JSON.parse(fs.readFileSync(F(n),'utf8'))}catch(e){return d}};
const wr=(n,v)=>{const t=F(n)+'.tmp';fs.writeFileSync(t,JSON.stringify(v));fs.renameSync(t,F(n))};
let secret;try{secret=fs.readFileSync(F('secret.key'),'utf8')}catch(e){secret=crypto.randomBytes(32).toString('hex');fs.writeFileSync(F('secret.key'),secret,{mode:0o600})}
const hash=(p,salt)=>crypto.scryptSync(p,salt,32).toString('hex');
let auth=rd('auth.json',null);
if(!auth){const salt=crypto.randomBytes(16).toString('hex');auth={u:process.env.ADMIN_USER||'admin',salt,h:hash(process.env.ADMIN_PASS||'admin123',salt)};wr('auth.json',auth)}
let db=rd('state.json',{ver:0,state:null});
const mac=b=>crypto.createHmac('sha256',secret).update(b).digest('hex');
const sign=u=>{const b=encodeURIComponent(u)+'.'+(Date.now()+30*864e5);return b+'.'+mac(b)};
const check=t=>{if(!t)return null;const p=t.split('.');if(p.length!==3)return null;const ok=mac(p[0]+'.'+p[1]);if(p[2].length!==ok.length||!crypto.timingSafeEqual(Buffer.from(p[2]),Buffer.from(ok)))return null;return+p[1]>Date.now()?decodeURIComponent(p[0]):null};
const cookie=req=>((req.headers.cookie||'').match(/(?:^|; )itl=([^;]+)/)||[])[1];
const SEC=process.env.SECURE?'; Secure':'';
const body=req=>new Promise(res=>{let d='';req.on('data',c=>{d+=c;if(d.length>8e6)req.destroy()});req.on('end',()=>{try{res(JSON.parse(d||'{}'))}catch(e){res({})}})});
const send=(res,c,o,h)=>{res.writeHead(c,Object.assign({'Content-Type':'application/json','Cache-Control':'no-store'},h));res.end(JSON.stringify(o))};
const eq=(a,b)=>a.length===b.length&&crypto.timingSafeEqual(Buffer.from(a),Buffer.from(b));
const fails={};
const MIME={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.png':'image/png','.svg':'image/svg+xml','.ico':'image/x-icon','.json':'application/json'};
http.createServer(async(req,res)=>{try{
 const u=new URL(req.url,'http://x'),p=u.pathname;
 if(p.startsWith('/api/')){
  if(p==='/api/login'&&req.method==='POST'){const ip=req.socket.remoteAddress,f=fails[ip]||{n:0,t:0};
   if(f.n>=5&&Date.now()<f.t)return send(res,429,{error:'Ko‘p urinish. 15 soniya kuting'});
   const b=await body(req);const ok=b.u===auth.u&&eq(hash(String(b.p||''),auth.salt),auth.h);
   if(!ok){f.n++;if(f.n>=5){f.t=Date.now()+15000;f.n=0}fails[ip]=f;return send(res,401,{error:'Login yoki parol noto‘g‘ri'})}
   delete fails[ip];return send(res,200,{ok:1,user:auth.u},{'Set-Cookie':'itl='+sign(auth.u)+'; HttpOnly; SameSite=Lax; Path=/; Max-Age=2592000'+SEC})}
  if(p==='/api/logout')return send(res,200,{ok:1},{'Set-Cookie':'itl=; HttpOnly; Path=/; Max-Age=0'});
  const user=check(cookie(req));if(!user)return send(res,401,{error:'auth'});
  if(p==='/api/state'&&req.method==='GET'){if(u.searchParams.get('v')==db.ver)return send(res,200,{same:1,ver:db.ver,user});return send(res,200,{state:db.state,ver:db.ver,user})}
  if(p==='/api/state'&&req.method==='PUT'){const b=await body(req);if(!b.state||!Array.isArray(b.state.laptops))return send(res,400,{error:'bad'});
   if(b.base!==db.ver)return send(res,409,{state:db.state,ver:db.ver});db={ver:db.ver+1,state:b.state};wr('state.json',db);return send(res,200,{ver:db.ver})}
  if(p==='/api/password'&&req.method==='POST'){const b=await body(req);
   if(!eq(hash(String(b.old||''),auth.salt),auth.h))return send(res,403,{error:'Joriy parol noto‘g‘ri'});
   const nu=String(b.user||auth.u).trim();if(nu.length<3)return send(res,400,{error:'Login kamida 3 belgi'});
   let h=auth.h,salt=auth.salt;if(b.pass){if(String(b.pass).length<6)return send(res,400,{error:'Parol kamida 6 belgi'});salt=crypto.randomBytes(16).toString('hex');h=hash(String(b.pass),salt)}
   auth={u:nu,salt,h};wr('auth.json',auth);return send(res,200,{ok:1},{'Set-Cookie':'itl='+sign(nu)+'; HttpOnly; SameSite=Lax; Path=/; Max-Age=2592000'+SEC})}
  return send(res,404,{error:'yo‘q'})}
 const f=path.normalize(path.join(PUB,p==='/'?'index.html':p));
 if(!f.startsWith(PUB)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){res.writeHead(404);return res.end('404')}
 res.writeHead(200,{'Content-Type':MIME[path.extname(f)]||'application/octet-stream'});fs.createReadStream(f).pipe(res)
}catch(e){try{send(res,500,{error:'server'})}catch(_){}}}).listen(PORT,()=>console.log('IT Live server: http://localhost:'+PORT));
