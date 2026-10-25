// Root segments used by the platform cannot be claimed as store addresses.
export const reservedStoreSlugs = new Set(['equipamentos','marketplace','marktplace','markrplace','entrar','sair','auth','admin','administracao','gestao','inicio','conta','empresa','cadastrar-empresa','primeiro-acesso','carrinho','finalizar','ajuda','termos','privacidade','sobre','loja','assets','downloads','api','www','suporte','favicon','robots','sitemap']);
export function publicStoreSlug(path){const match=/^\/([a-z0-9][a-z0-9-]{2,99})\/?$/.exec(path);return match&&!reservedStoreSlugs.has(match[1])?match[1]:null;}
export function storePath(slug){return '/'+encodeURIComponent(slug);}
