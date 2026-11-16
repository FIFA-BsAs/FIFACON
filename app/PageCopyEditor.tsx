'use client';
import { useRef, useState } from 'react';
import { copyFields, copyKeys, type CopyKey, type PageCopy } from './pageCopy';

export default function PageCopyEditor({values, onChange}: {
  values: PageCopy;
  onChange: (key: CopyKey, value: string) => void;
}) {
  const [query, setQuery] = useState('');
  const searchValues = useRef(values);
  const term = query.trim().toLocaleLowerCase('es');
  const matches = copyKeys.filter(key =>
    [...copyFields[key], searchValues.current[key]].some(text => text.toLocaleLowerCase('es').includes(term))
  );
  const groups = [...new Set(matches.map(key => copyFields[key][0]))];
  return <>
    <label className="field"><span>Buscar texto o sección</span><input type="search" value={query} onChange={e=>{searchValues.current=values; setQuery(e.target.value)}} /></label>
    {groups.map(group=><details className="edit-session" key={group + Boolean(term)} open={term ? true : undefined}>
      <summary>{group}</summary>
      {matches.filter(key=>copyFields[key][0]===group).map(key=>
        <label key={key} className="field"><span>{copyFields[key][1]}</span>
          <textarea rows={2} maxLength={500} value={values[key]} onChange={e=>onChange(key,e.target.value)}/>
        </label>
      )}
    </details>)}
    {!matches.length && <p>Sin coincidencias. Las actividades, los expositores y las preguntas se editan en sus secciones.</p>}
  </>;
}
