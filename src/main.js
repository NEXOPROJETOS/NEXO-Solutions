import { brand, projects, services } from './data/config.js';
import { footer, header } from './components/ui.js';
import { homePage } from './pages/sections.js';
import { demoPage } from './pages/demo.js';
import { submitQuoteRequest, supabaseConfigured } from './lib/supabase.js';
import './styles/main.css';

const app = document.querySelector('#app');
let activeCleanups = [];
const on = (target, event, handler, options) => {
  target?.addEventListener(event, handler, options);
  if (target) activeCleanups.push(() => target.removeEventListener(event, handler, options));
};
const mailto = (to, subject, body) => `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

function render() {
  activeCleanups.forEach(cleanup => cleanup()); activeCleanups = [];
  const hash = decodeURIComponent(location.hash || '#inicio');
  const demoMatch = hash.match(/^#projeto\/([a-z-]+)$/);
  app.innerHTML = `${header()}${demoMatch ? demoPage(demoMatch[1]) : homePage()}${footer(brand)}<a class="floating-contact" href="#contato" aria-label="Ir para contato pelo WhatsApp"><span class="wa-mark">◔</span><span>Vamos conversar</span><i>↗</i></a><div class="toast-global" role="status" aria-live="polite"></div>`;
  bindGlobal();
  if (demoMatch) bindDemo(demoMatch[1]); else bindHome();
  requestAnimationFrame(() => document.querySelector('.site-header')?.classList.add('header-ready'));
}

function bindGlobal() {
  const menu = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.main-nav');
  on(menu, 'click', () => { const open = menu.getAttribute('aria-expanded') === 'true'; menu.setAttribute('aria-expanded', String(!open)); menu.setAttribute('aria-label', open ? 'Abrir menu' : 'Fechar menu'); nav.classList.toggle('nav-open', !open); });
  document.querySelectorAll('.main-nav a').forEach(link => on(link, 'click', () => { menu?.setAttribute('aria-expanded','false'); nav?.classList.remove('nav-open'); }));
  document.querySelectorAll('a[href="#contato"], a[href="#orcamento"]').forEach(link => on(link, 'click', () => {
    const wanted = link.dataset.service;
    const project = link.dataset.project;
    if (wanted || project) sessionStorage.setItem('nexoInquiry', wanted ? `service:${wanted}` : `project:${project}`);
  }));
  const floating = document.querySelector('.floating-contact');
  const number = brand.whatsapp.replace(/\D/g, '');
  if (number && floating) {
    floating.href = `https://wa.me/${number}?text=${encodeURIComponent('Olá! Gostaria de conversar sobre um projeto.')}`;
    floating.target = '_blank'; floating.rel = 'noopener noreferrer';
  } else if (floating) {
    floating.href = `mailto:${brand.email}?subject=${encodeURIComponent('Vamos conversar sobre um projeto')}`;
    floating.setAttribute('aria-label', 'Enviar e-mail para conversar sobre um projeto');
  }
}

function bindHome() {
  const form = document.querySelector('#quote-form');
  const submitButton = form?.querySelector('[type="submit"]');
  const deliveryHint = form?.querySelector('.form-footer > span');
  if (submitButton && supabaseConfigured) {
    submitButton.textContent = 'Enviar solicitação ↗';
    if (deliveryHint) deliveryHint.textContent = 'Seus dados serão enviados para a NEXO com segurança.';
  }
  const inquiry = sessionStorage.getItem('nexoInquiry');
  if (inquiry && form) {
    const [kind, value] = inquiry.split(':');
    if (kind === 'service') form.elements.service.value = value;
    if (kind === 'project') form.elements.message.value = `Olá! Gostaria de conversar sobre um projeto como ${value}. `;
    sessionStorage.removeItem('nexoInquiry');
  }
  on(form, 'submit', async e => {
    e.preventDefault();
    const status = form.querySelector('.form-status');
    const required = [...form.querySelectorAll('[required]')];
    const invalid = required.find(el => !el.value.trim() || !el.checkValidity());
    if (invalid) { invalid.setAttribute('aria-invalid','true'); invalid.reportValidity(); status.textContent = 'Confira os campos destacados para continuar.'; status.className = 'form-status error'; invalid.focus(); return; }
    required.forEach(el => el.removeAttribute('aria-invalid'));
    const data = new FormData(form);
    const values = Object.fromEntries(['name','company','email','phone','service','message'].map(key => [key, String(data.get(key) || '')]));
    const service = services.find(s => s.id === values.service)?.name || 'A definir';
    const body = [`Olá! Gostaria de solicitar um orçamento.`, ``, `Nome: ${values.name}`, `Empresa: ${values.company || 'Não informada'}`, `E-mail: ${values.email}`, `Telefone: ${values.phone || 'Não informado'}`, `Serviço: ${service}`, ``, `Sobre o projeto:`, values.message].join('\n');
    const submit = form.querySelector('[type="submit"]');
    submit.disabled = true;
    submit.setAttribute('aria-busy', 'true');
    submit.textContent = 'Enviando…';
    const number = brand.whatsapp.replace(/\D/g, '');
    try {
      if (supabaseConfigured) {
        await submitQuoteRequest(values);
        status.textContent = 'Solicitação enviada. Obrigado por compartilhar sua ideia com a NEXO!';
      } else if (number) {
        status.textContent = 'Abrindo o WhatsApp com os detalhes do seu projeto…';
        window.open(`https://wa.me/${number}?text=${encodeURIComponent(body)}`, '_blank', 'noopener,noreferrer');
      } else {
        status.textContent = 'Abrindo seu aplicativo de e-mail com a solicitação preenchida…';
        window.location.href = mailto(brand.email, `Orçamento — ${values.name} / ${service}`, body);
      }
      status.className = 'form-status success';
      if (supabaseConfigured) form.reset();
    } catch (error) {
      console.error('Falha ao enviar solicitação para o Supabase.', error);
      status.className = 'form-status error';
      status.innerHTML = `Não foi possível registrar a solicitação. <a href="${mailto(brand.email, `Orçamento — ${values.name} / ${service}`, body)}">Tente pelo e-mail</a>.`;
    } finally {
      submit.disabled = false;
      submit.removeAttribute('aria-busy');
      submit.innerHTML = `Preparar mensagem <span aria-hidden="true">↗</span>`;
    }
  });
  form?.querySelectorAll('input,select,textarea').forEach(el => on(el, 'input', () => el.removeAttribute('aria-invalid')));
}

function bindDemo(id) {
  if (id === 'commerce') bindCommerce();
  if (id === 'management') bindManagement();
  if (id === 'learning') bindLearning();
  if (id === 'analytics') bindAnalytics();
}

function bindCommerce() {
  let category = 'Todas'; let max = 800;
  const search = document.querySelector('#product-search');
  const price = document.querySelector('#price-filter');
  const sort = document.querySelector('#product-sort');
  const grid = document.querySelector('#product-grid');
  const products = [
    { name: 'Vaso Aurora', category: 'Cerâmica', price: 189, tone: 'sand', mark: '◯' }, { name: 'Luminária Arco', category: 'Iluminação', price: 429, tone: 'blue', mark: '◡' }, { name: 'Bowl Terracota', category: 'Cerâmica', price: 129, tone: 'clay', mark: '◔' }, { name: 'Banco Linha', category: 'Mobiliário', price: 690, tone: 'olive', mark: '⌁' }, { name: 'Copo Bruma', category: 'Cerâmica', price: 89, tone: 'mist', mark: '○' }, { name: 'Abajur Nilo', category: 'Iluminação', price: 359, tone: 'plum', mark: '⌒' },
  ];
  const update = () => {
    const term = search.value.toLocaleLowerCase('pt-BR');
    let list = products.filter(p => (category === 'Todas' || p.category === category) && p.price <= max && `${p.name} ${p.category}`.toLocaleLowerCase('pt-BR').includes(term));
    if (sort.value === 'asc') list.sort((a,b)=>a.price-b.price); if (sort.value === 'desc') list.sort((a,b)=>b.price-a.price);
    grid.innerHTML = renderProductCards(list);
    document.querySelector('#product-count').textContent = `${list.length} ${list.length === 1 ? 'peça' : 'peças'} para explorar`;
  };
  on(grid, 'click', e => {
    const save = e.target.closest('[data-save]');
    const add = e.target.closest('[data-add]');
    if (save) { const saved = save.getAttribute('aria-pressed') === 'true'; save.setAttribute('aria-pressed', String(!saved)); save.textContent = saved ? '♡' : '♥'; showToast(saved ? 'Peça removida dos favoritos.' : 'Peça salva nos favoritos desta sessão.'); }
    if (add) showToast(`${add.dataset.add} adicionada à sacola demonstrativa.`);
  });
  on(search,'input',update); on(sort,'change',update); on(price,'input',()=>{ max=Number(price.value); document.querySelector('#price-label').textContent=`R$ ${max}`; update(); });
  document.querySelectorAll('.filter-category').forEach(btn=>on(btn,'click',()=>{category=btn.dataset.category; document.querySelectorAll('.filter-category').forEach(b=>b.classList.toggle('active',b===btn)); update();}));
  update();
}

function renderProductCards(list) {
  if (!list.length) return '<div class="shop-empty">Nenhuma peça encontrada.<br><span>Tente mudar a busca ou os filtros.</span></div>';
  return list.map((p,i)=>`<article class="shop-product"><button class="product-save" data-save="${i}" aria-label="Salvar ${p.name}" aria-pressed="false">♡</button><div class="shop-product-image tone-${p.tone}"><span>${p.mark}</span><i></i></div><div class="shop-product-details"><span>${p.category}</span><b>${p.name}</b><div><strong>R$ ${p.price.toFixed(2).replace('.',',')}</strong><button data-add="${p.name}">Adicionar +</button></div></div></article>`).join('');
}

function bindManagement() {
  let records = [ ['NX-0248','Ateliê Horizonte','Conteúdo digital','Em andamento','18 nov, 2026'], ['NX-0247','Casa Amora','Loja virtual','Em análise','16 nov, 2026'], ['NX-0246','Verde Vivo','Painel de gestão','Concluído','12 nov, 2026'], ['NX-0245','Estúdio Traço','Site institucional','Em andamento','10 nov, 2026'], ['NX-0244','Ponto Norte','Plataforma web','Concluído','07 nov, 2026'] ];
  let all = false;
  const search = document.querySelector('#record-search'), filter = document.querySelector('#record-status');
  const draw = () => {
    let rows = records.filter(r => (filter.value === 'Todos' || r[3] === filter.value) && r.join(' ').toLocaleLowerCase('pt-BR').includes(search.value.toLocaleLowerCase('pt-BR')));
    if (!all) rows = rows.slice(0,5);
    document.querySelector('#record-rows').innerHTML = rows.length ? rows.map(r=>`<tr><td><span class="record-id">${r[0]}</span></td><td><b>${r[1]}</b></td><td>${r[2]}</td><td><span class="status-pill ${r[3].toLowerCase().replace(' ','-')}"><i></i>${r[3]}</span></td><td>${r[4]}</td></tr>`).join('') : '<tr><td colspan="5" class="empty-row">Nenhum registro corresponde à busca.</td></tr>';
    document.querySelector('#record-range').textContent = `Mostrando ${rows.length ? 1 : 0}–${rows.length} de ${records.length} registros demonstrativos`;
  };
  on(search,'input',draw); on(filter,'change',draw);
  on(document.querySelector('#view-all-records'),'click',e=>{e.preventDefault();all=!all;e.currentTarget.textContent=all?'Ver menos ↑':'Ver todos ↗';draw();});
  const modal = document.querySelector('#record-modal');
  on(document.querySelector('#add-record'),'click',()=>{modal.classList.add('open');modal.setAttribute('aria-hidden','false');modal.querySelector('input').focus();});
  const close = () => {modal.classList.remove('open');modal.setAttribute('aria-hidden','true');};
  on(modal.querySelector('.modal-close'),'click',close); on(modal,'click',e=>{if(e.target===modal)close();});
  on(document.querySelector('#record-form'),'submit',e=>{e.preventDefault();const data=new FormData(e.currentTarget);const num=248+records.length-5+1;records.unshift([`NX-${String(num).padStart(4,'0')}`,data.get('recordName'),data.get('recordCategory'),data.get('recordStatus'),'12 nov, 2026']);document.querySelector('#record-total').textContent=String(248+records.length-5);all=true;draw();close();e.currentTarget.reset();showToast('Registro incluído nesta demonstração.');});
  on(document.querySelector('#csv-export'),'click',()=>{const csv=['Registro,Nome,Categoria,Status,Data',...records.map(r=>r.map(v=>`"${v.replaceAll('"','""')}"`).join(','))].join('\n');const a=document.createElement('a');a.href=URL.createObjectURL(new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8'}));a.download='nexo-management-registros.csv';a.click();URL.revokeObjectURL(a.href);showToast('Arquivo CSV demonstrativo exportado.');});
}

function bindLearning() {
  const courses = [ ['Design digital','Interfaces que contam histórias','Com Marina Costa',8,'1h 40min','course-purple','✳'], ['Criatividade','Ideias em movimento','Com Lucas Almeida',6,'58 min','course-orange','◒'], ['Tecnologia','Primeiros passos na web','Com Ana Ribeiro',10,'2h 15min','course-green','⌘'], ['Design digital','Cor, forma e expressão','Com Marina Costa',5,'45 min','course-blue','◈'] ];
  let category='Todos', selected=-1;
  const search=document.querySelector('#course-search');
  const render=()=>{const term=search.value.toLocaleLowerCase('pt-BR');const list=courses.map((c,i)=>({...c,index:i})).filter(c=>(category==='Todos'||category==='Em andamento'||c[0]===category)&&`${c[0]} ${c[1]} ${c[2]}`.toLocaleLowerCase('pt-BR').includes(term));document.querySelector('#course-grid').innerHTML=list.length?list.map(c=>`<article class="course-card"><div class="course-art ${c[5]}"><span>${c[6]}</span><i>n.</i><button type="button" class="course-play" data-course="${c.index}" aria-label="Abrir ${c[1]}">▶</button></div><div class="course-card-info"><span>${c[0]}</span><b>${c[1]}</b><small>${c[2]}</small><div><span>▤ ${c[3]} aulas　◷ ${c[4]}</span><button class="course-bookmark" aria-label="Salvar curso" aria-pressed="false">♡</button></div></div></article>`).join(''):'<div class="course-empty">Nenhum curso encontrado. Experimente outro termo ou categoria.</div>';};
  const setCategory=value=>{category=value;document.querySelectorAll('[data-learn-filter]').forEach(b=>b.classList.toggle('active',b.dataset.learnFilter===value));render();};
  document.querySelectorAll('[data-learn-filter]').forEach(btn=>on(btn,'click',()=>setCategory(btn.dataset.learnFilter))); on(search,'input',render);
  const modal=document.querySelector('#lesson-modal');
  const openCourse=i=>{selected=i;document.querySelector('#lesson-title').textContent=courses[i][1];modal.classList.add('open');modal.setAttribute('aria-hidden','false');};
  const close=()=>{modal.classList.remove('open');modal.setAttribute('aria-hidden','true');};
  on(document.querySelector('#course-grid'),'click',e=>{const btn=e.target.closest('[data-course]');if(btn)openCourse(Number(btn.dataset.course));});
  on(modal.querySelector('.modal-close'),'click',close);on(modal,'click',e=>{if(e.target===modal)close();});
  on(document.querySelector('#mark-lesson'),'click',()=>{close();showToast(`“${courses[selected][1]}” marcada como concluída nesta sessão.`);});render();
}

function bindAnalytics() {
  const sets={7:{visits:'11.284',engagement:'1.572',conversions:'248',rate:'2,20%',labels:['06 nov','07 nov','08 nov','09 nov','10 nov','11 nov','12 nov'],path:'M0 170 C70 140 70 115 170 140 S260 72 350 112 S460 64 520 86 S610 36 700 18'},30:{visits:'48.392',engagement:'6.248',conversions:'1.083',rate:'2,24%',labels:['13 out','18 out','23 out','28 out','02 nov','07 nov','12 nov'],path:'M0 185 C40 173 45 146 90 158 S135 183 175 126 S220 139 260 111 S305 141 350 91 S395 113 440 80 S480 102 525 56 S570 85 610 43 S665 52 700 17'},90:{visits:'132.641',engagement:'18.902',conversions:'3.476',rate:'2,62%',labels:['14 ago','29 ago','13 set','28 set','13 out','28 out','12 nov'],path:'M0 196 C60 185 70 152 120 169 S180 133 230 143 S280 97 340 125 S390 92 450 105 S510 49 560 75 S640 38 700 16'}};
  const period=document.querySelector('#analytics-period');
  const update=()=>{const data=sets[period.value];Object.entries(data).forEach(([k,v])=>{const el=document.querySelector(`[data-metric="${k}"]`);if(el)el.textContent=v;});document.querySelector('#x-labels').innerHTML=data.labels.map(x=>`<span>${x}</span>`).join('');const path=document.querySelector('.chart-line');path.setAttribute('d',data.path);const fill=document.querySelector('.chart-fill');fill.setAttribute('d',`${data.path} V230 H0Z`);};
  on(period,'change',update);on(document.querySelector('#analytics-channel'),'change',e=>{const card=document.querySelector('.main-chart-card');card.dataset.channel=e.target.value;showToast(`Visualização atualizada: ${e.target.options[e.target.selectedIndex].text}.`);});
}

function showToast(message) { const toast=document.querySelector('.toast-global') || document.querySelector('.commerce-toast'); if(!toast)return;toast.textContent=message;toast.classList.add('visible');clearTimeout(showToast.timer);showToast.timer=setTimeout(()=>toast.classList.remove('visible'),2800); }

window.addEventListener('hashchange', render);
render();
