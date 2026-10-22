export const MANAGEMENT_ORIGIN = 'https://gestao.norieco.com.br';
export function validBridgeMessage(event, popup, nonce) {
  return event.origin === MANAGEMENT_ORIGIN && event.source === popup &&
    event.data?.nonce === nonce && ['norieco-auth-ready','norieco-auth-complete','norieco-auth-error'].includes(event.data?.type);
}
// Exact origins/windows only. Secrets never enter links, history or logs.
export function connectManagement(getSession, target = window) {
  const nonce = crypto.randomUUID();
  const popup = target.open(`${MANAGEMENT_ORIGIN}/auth/bridge?state=${nonce}`, '_blank');
  if (!popup) return Promise.reject(new Error('Permita abrir o painel em uma nova aba e tente novamente.'));
  return new Promise((resolve, reject) => {
    let sent = false;
    const finish = (error) => {
      clearTimeout(timer);target.removeEventListener('message', receive);
      error ? reject(error) : resolve();
    };
    const receive = async (event) => {
      if (!validBridgeMessage(event,popup,nonce)) return;
      if (event.data.type === 'norieco-auth-error') return finish(new Error('Não foi possível abrir sua sessão. Tente novamente.'));
      if (event.data.type === 'norieco-auth-complete') return finish();
      if (sent) return;
      sent = true;
      try {
        const {data, error} = await getSession();
        if (error) throw error;
        if (!data.session) { popup.location.replace(MANAGEMENT_ORIGIN+'/inicio');return finish(); }
        popup.postMessage({type:'norieco-auth-session',nonce,accessToken:data.session.access_token,userId:data.session.user.id},MANAGEMENT_ORIGIN);
      } catch { finish(new Error('Não foi possível transferir o acesso. Tente novamente.')); }
    };
    target.addEventListener('message',receive);
    const timer = setTimeout(()=>finish(new Error('O painel demorou para responder. Tente novamente.')),60000);
  });
}
