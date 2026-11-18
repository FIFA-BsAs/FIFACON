'use client';
import { mathText } from './mathText';
import {useRef, useState, type CSSProperties, type KeyboardEvent} from 'react';
import type {Content} from './content';

const digits=(n:number)=>String(n).padStart(2,'0');
const channelColors = ['#f2e96a', '#41d4e2', '#e79adf', '#ffad75', '#a6df8b', '#b9abff', '#ffa2aa', '#85bfef', '#e9c18a', '#86e2c0'];

function signalPath(channel: number, divisions: number, center: number, amplitude: number) {
 const cycles = (4 + channel) * divisions / 10;
 return Array.from({length: 721}, (_, x) => {
  const phase = x / 720 * cycles * 2 * Math.PI;
  const sine = Math.sin(phase);
  const wave = [Math.tanh(6 * sine), sine, 2 / Math.PI * Math.asin(sine)][channel % 3];
  return (x ? 'L' : 'M') + x + ',' + (center - amplitude * wave).toFixed(2);
 }).join(' ');
}

export default function ScopeSchedule({days,showTimes,frame,copy}:{copy:Content['copy'];frame:Content['scopeFrame'];days:Content['days'];showTimes:boolean}){
 const [day,setDay]=useState(0),[activity,setActivity]=useState(0);
 const options=useRef<(HTMLButtonElement|null)[]>([]);
 const dayIndex=Math.min(day,days.length-1),current=days[dayIndex];
 const sessions=current?.sessions||[],index=Math.min(activity,Math.max(0,sessions.length-1)),selected=sessions[index];
 function selectDay(next:number){setDay(next);setActivity(0)}
 function keyboard(e:KeyboardEvent<HTMLButtonElement>,i:number){let next=i;if(e.key==='ArrowDown')next=(i+1)%sessions.length;else if(e.key==='ArrowUp')next=(i-1+sessions.length)%sessions.length;else if(e.key==='Home')next=0;else if(e.key==='End')next=sessions.length-1;else return;e.preventDefault();setActivity(next);options.current[next]?.focus();}
 const channelName = copy.channel + (dayIndex + 1);
 const channelStyle = {'--channel-color': channelColors[dayIndex]} as CSSProperties;
 const trace = signalPath(dayIndex, 10, 125, 62.5);
 const overview = signalPath(dayIndex, 50, 23, 14);
 return <div className="scope-instrument" role="region" aria-label="Cronograma interactivo del congreso">
  <div className="scope-case-label"><span><b>{mathText(frame.brand)}</b> {mathText(frame.model)}</span><span>{mathText(frame.header)} <i aria-hidden="true"/></span></div>
  <div className="scope-console">
  <div className="scope-main-panel">
   <div className="scope-display" style={channelStyle}>
   <div className="scope-status"><span className="scope-running">{mathText(copy.run)}</span><strong className="scope-active-channel">{mathText(channelName)} · {mathText(current?.label)}</strong><span>{mathText(copy.base)}</span><span className="scope-trigger">{mathText(copy.trigger)}</span></div>

   <div className="scope-acquisition" aria-hidden="true">
    <div className="scope-plots">
     <div className="scope-overview"><span>{mathText(copy.overview)}</span><svg viewBox="0 0 720 46" preserveAspectRatio="none"><path className="scope-selection-window" d="M280 0H440V46H280Z"/><path className="scope-active-channel scope-signal" d={overview}/></svg></div>
     <div className="scope-graticule"><svg viewBox="0 0 720 250" preserveAspectRatio="none">
      <g className="scope-grid">{Array.from({length:11},(_,i)=><path key={`v${i}`} d={`M${i*72} 0V250`}/>)}{Array.from({length:9},(_,i)=><path key={`h${i}`} d={`M0 ${i*31.25}H720`}/>)}</g>
      <path className="scope-axis" d="M0 125H720 M360 0V250"/>
      <g className="scope-ticks">{Array.from({length:51},(_,i)=><path key={i} d={`M${i*14.4} 122V128`}/>)}{Array.from({length:41},(_,i)=><path key={i} d={`M357 ${i*6.25}H363`}/>)}</g>
      <path className="scope-cursor" d="M300 0V250"/>
      <path className="scope-signal scope-active-channel" d={trace}/>
      <path className="scope-trigger-marker" d="M292 1H308L300 11Z"/>
     </svg><span className="scope-trigger-tag">{mathText(copy.marker)}</span><span className="scope-zero scope-active-channel">{dayIndex+1}▸</span><div key={dayIndex} className="scope-sweep"/></div>
     <div className="scope-scales"><span className="scope-active-channel"><b>{mathText(channelName)}</b> {mathText(copy.vdiv)}</span><span>{mathText(copy.tdiv)}</span></div>
    </div>
    <div className="scope-measures"><div className="scope-active-channel"><span>{mathText(channelName)} {mathText(copy.freq)}</span><strong>{((4 + dayIndex) * 2.5).toFixed(2)} {mathText(copy.unit)}</strong><small>{mathText(copy.vpp)}</small></div></div>
    <div className="scope-acquisition-foot"><span>{mathText(copy.zero)}</span><span>{mathText(channelName)} {mathText(copy.level)}</span><span>{mathText(copy.sim)}</span></div>
   </div>
   </div>
    <div className="scope-detail" id="scope-detail" aria-live="polite" aria-atomic="true"><div className="scope-readout"><span>{mathText(selected?copy.act + ' ' + digits(index+1):copy.wait)}</span><span>{showTimes&&selected?.time?<time>{mathText(selected.time)}</time>:mathText(copy.noTime)}</span></div>{selected?<><p className="scope-kind">{mathText(selected.type||copy.noKind)}</p><h3>{mathText(selected.title||copy.noTitle)}</h3><p className="scope-description">{mathText(selected.description||copy.noDesc)}</p></>:<><h3>{mathText(copy.emptyTitle)}</h3><p className="scope-description">{mathText(copy.emptyDesc)}</p></>}</div>
   <div className="scope-bottom"><span className="scope-small">{mathText(current?.label)} <b>/</b> {sessions.length?`${digits(index+1)} ${mathText(copy.countOf)} ${digits(sessions.length)}`:copy.noActivities}</span><div className="scope-pagination" role="group" aria-label="Recorrer actividades"><button type="button" disabled={!selected||index===0} onClick={()=>setActivity(index-1)}>{mathText(copy.prev)}</button><button type="button" disabled={!selected||index===sessions.length-1} onClick={()=>setActivity(index+1)}>{mathText(copy.next)}</button></div></div>
  </div>
  <aside className="scope-controls" aria-label="Botonera del programa">
   <p className="scope-small">{mathText(frame.channels)}</p>
   <div className="scope-channels" role="group" aria-label="Elegir jornada"><button className="scope-day-arrow" type="button" aria-label="Jornada anterior" disabled={days.length<2} onClick={()=>selectDay((dayIndex-1+days.length)%days.length)}>←</button>{days.map((d,i)=><button type="button" key={i} aria-pressed={i===dayIndex} onClick={()=>selectDay(i)}><span className="scope-channel-key" style={{borderColor:channelColors[i]}}>{mathText(copy.channel)}{i+1}</span>{mathText(d.label)}</button>)}<button className="scope-day-arrow" type="button" aria-label="Jornada siguiente" disabled={days.length<2} onClick={()=>selectDay((dayIndex+1)%days.length)}>→</button></div>
   <div className="scope-options"><p className="scope-small">{mathText(frame.activities)}</p><div className="scope-activity-list" role="group" aria-label="Actividades de la jornada">{sessions.map((s,i)=><button type="button" key={i} ref={node=>{options.current[i]=node}} aria-pressed={index===i} aria-controls="scope-detail" onKeyDown={e=>keyboard(e,i)} onClick={()=>setActivity(i)}><span className="scope-option-index">{digits(i+1)}</span><span>{mathText(s.title||copy.noTitle)}{showTimes&&s.time&&<time>{mathText(s.time)}</time>}</span><span aria-hidden="true">{index===i?'◂':'·'}</span></button>)}</div>{!sessions.length&&<p className="scope-empty">{mathText(copy.emptyList)}</p>}</div>
  </aside>
  </div>
  <div className="scope-case-foot"><span>{mathText(frame.footerLeft)}</span><span>{mathText(frame.footerRight.replaceAll('{canales}', days.length + (days.length === 1 ? ' CANAL' : ' CANALES')))}</span></div>
 </div>;
}
