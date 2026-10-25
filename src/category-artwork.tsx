import type {CSSProperties} from 'react';
import {Icon} from './ui';

const artwork:Record<string,[string,string]>={
 explorar:['compass','#bc76ff'], restaurantes:['food','#ffad66'], lanches:['burger','#ffb44e'],
 bares:['drink','#f27fce'], roupas:['shirt','#c08aff'], mercados:['basket','#60db9a'],
 farmacias:['pharmacy','#64dfd5'], balnearios:['beach','#58d2f4'], diversao:['gamepad','#c27cff'],
 'por do sol':['sunset','#ffad65'], passeios:['compass','#8fb3ff'], beleza:['scissors','#f18dc8'],
 servicos:['tools','#be82fa'], peixarias:['fish','#57d3ee'], conveniencias:['bottle','#7bdc9e'],
};
export function CategoryArtwork({name,fallback='shop'}:{name:string;fallback?:string}) {
  const key=name.normalize('NFD').replace(/\p{M}/gu,'').trim().toLowerCase();
  const [icon,color]=artwork[key]??[fallback,'#bc76ff'];
  return <span className="mkt-category-art" aria-hidden="true" style={{'--category-glow':color} as CSSProperties}><Icon name={icon} size={48}/></span>;
}
