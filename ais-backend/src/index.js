// AISStream receiver. The API key stays in Cloudflare Worker secrets.
// Public map endpoint returns only recent AIS positions, never credentials.
const ORIGIN = 'https://asyraf6857.github.io';
const BBOX = [[1.12,103.42],[1.55,103.80]]; // PTP vicinity; AISStream lat/lon corners
const HEADERS = {'Access-Control-Allow-Origin':ORIGIN,'Cache-Control':'no-store','Content-Type':'application/json'};
const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:HEADERS});
export default {
  async fetch(request,env){
    const url=new URL(request.url);
    if(request.method==='OPTIONS')return new Response(null,{status:204,headers:{...HEADERS,'Access-Control-Allow-Methods':'GET, OPTIONS','Access-Control-Allow-Headers':'Content-Type'}});
    if(request.method!=='GET')return json({error:'Method not allowed'},405);
    if(url.pathname!=='/vessels'&&url.pathname!=='/health')return json({error:'Not found'},404);
    const stub=env.AIS_ROOM.get(env.AIS_ROOM.idFromName('ptp-live-feed'));
    return stub.fetch('https://internal'+url.pathname);
  },
  async scheduled(_event,env,ctx){
    const stub=env.AIS_ROOM.get(env.AIS_ROOM.idFromName('ptp-live-feed'));
    ctx.waitUntil(stub.fetch('https://internal/connect'));
  }
};
export class AISRoom {
  constructor(state,env){this.state=state;this.env=env;this.ws=null;this.lastConnect=0;this.positions=new Map();this.stats={received:0,accepted:0,rejected:0,lastMessageAt:null,lastError:null,lastMessageType:null};this.ready=this.restore();}
  async restore(){const rows=await this.state.storage.get('positions');if(Array.isArray(rows))this.positions=new Map(rows);}
  async fetch(request){
    await this.ready;
    const path=new URL(request.url).pathname;
    if(path==='/connect'){this.connect();return json({status:'connecting'});}
    if(path==='/health')return json({status:this.ws?.readyState===1?'connected':'waiting',vessels:this.positions.size,lastAttempt:this.lastConnect,diagnostics:this.stats});
    if(path==='/vessels'){
      const now=Date.now();
      const vessels=[...this.positions.values()].filter(v=>now-Date.parse(v.updatedAt)<15*60*1000);
      return json({vessels,updatedAt:new Date().toISOString(),source:'AISStream',feedConnected:this.ws?.readyState===1});
    }
    return json({error:'Not found'},404);
  }
  connect(){
    if(this.ws&&(this.ws.readyState===0||this.ws.readyState===1))return;
    if(Date.now()-this.lastConnect<20000)return;
    if(!this.env.AISSTREAM_API_KEY){this.stats.lastError='AISSTREAM_API_KEY missing';return;}
    this.lastConnect=Date.now();
    try{
      const ws=new WebSocket('wss://stream.aisstream.io/v0/stream');
      this.ws=ws;
      ws.addEventListener('open',()=>{
        ws.send(JSON.stringify({APIKey:this.env.AISSTREAM_API_KEY,BoundingBoxes:[BBOX],FilterMessageTypes:['PositionReport','StandardClassBPositionReport','ExtendedClassBPositionReport']}));
      });
      ws.addEventListener('message',event=>{this.stats.received++;this.stats.lastMessageAt=new Date().toISOString();try{const raw=typeof event.data==='string'?event.data:typeof event.data?.text==='function'?null:String(event.data);if(raw===null){this.stats.lastError='Non-text WebSocket message';return;}const msg=JSON.parse(raw);this.stats.lastMessageType=String(msg.MessageType||'unknown').slice(0,64);if(msg.MessageType==='Error'||msg.error)this.stats.lastError='AISStream returned an error message';this.ingest(msg)}catch(e){this.stats.lastError='Message processing: '+String(e?.message||e).slice(0,160);}});
      ws.addEventListener('close',()=>{if(this.ws===ws)this.ws=null});
      ws.addEventListener('error',()=>{this.stats.lastError='WebSocket error';try{ws.close()}catch(_e){}});
    }catch(e){this.stats.lastError='WebSocket setup failed: '+String(e?.message||e).slice(0,120);this.ws=null}
  }
  ingest(msg){
    const data=msg.Message?.PositionReport||msg.Message?.StandardClassBPositionReport||msg.Message?.ExtendedClassBPositionReport;
    if(!data){this.stats.rejected++;return;}
    const mmsi=String(msg.MetaData?.MMSI||data.UserID||'');
    const lat=Number(data.Latitude),lng=Number(data.Longitude);
    if(!/^\d{9}$/.test(mmsi)||!Number.isFinite(lat)||!Number.isFinite(lng)||lat<1.12||lat>1.55||lng<103.42||lng>103.80){this.stats.rejected++;return;}
    const updatedAt=new Date().toISOString();
    this.stats.accepted++;this.positions.set(mmsi,{mmsi,name:String(msg.MetaData?.ShipName||'Unknown vessel').trim(),lat,lng,sog:Number(data.Sog),cog:Number(data.Cog),heading:Number(data.TrueHeading),updatedAt});
    if(this.positions.size>1500){for(const [id,v] of this.positions){if(Date.now()-Date.parse(v.updatedAt)>15*60*1000)this.positions.delete(id)}}
    if(!this.savePending){this.savePending=true;this.state.storage.setAlarm(Date.now()+10000).catch(()=>{});}
  }
  async alarm(){
    const now=Date.now();
    for(const [id,v] of this.positions){if(now-Date.parse(v.updatedAt)>15*60*1000)this.positions.delete(id)}
    await this.state.storage.put('positions',[...this.positions.entries()]);
    this.savePending=false;
    // Outbound WebSocket lifetimes depend on Worker runtime. Cron re-establishes if disconnected.
  }
}
