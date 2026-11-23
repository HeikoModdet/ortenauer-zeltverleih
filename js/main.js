/* ============================================================
   Ortenauer Zeltverleih – Main Script
   Lädt Inhalte aus content/site.json (editierbar) und rendert sie.
   ============================================================ */
(function(){
  'use strict';

  const CONTENT_URL = 'content/site.json';

  /* ---------- Hilfsfunktionen ---------- */
  function setText(el, val){ if(el) el.textContent = val; }
  function setAttr(el, a, val){ if(el) el.setAttribute(a, val); }

  /* ---------- Daten aus JSON schreiben ---------- */
  function bindBase(data){
    // Alle [data-bind] Elemente befüllen
    document.querySelectorAll('[data-bind]').forEach(el=>{
      const keys = el.getAttribute('data-bind').split('.');
      let v = data;
      for(const k of keys){ if(v) v = v[k]; }
      if(v===undefined||v===null) return;
      if(el.tagName==='A' && el.hasAttribute('href') && el.getAttribute('href').startsWith('mailto:')){
        // mailto-Link konsistent halten
        setText(el, v);
        if(data.form && data.form.mailto) setAttr(el,'href','mailto:'+data.form.mailto);
      }
      else if(el.tagName==='IMG' && (el.hasAttribute('src'))){
        setAttr(el,'src', v);
      }
      else setText(el, v);
    });

    // Meta-Beschreibung
    const meta = document.querySelector('meta[name=description]');
    if(meta && data.seo) setAttr(meta,'content',data.seo.description);

    // Hero-Bild
    if(data.hero && data.hero.image){
      const hi=document.getElementById('heroImg');
      if(hi){ setAttr(hi,'src', data.hero.image); setAttr(hi,'alt', data.hero.title); }
    }
    // Portrait
    if(data.ueber && data.ueber.portrait){
      const p=document.getElementById('ueberPortrait');
      if(p) setAttr(p,'src', data.ueber.portrait);
    }
    // Öffnungszeiten
    if(data.kontakt && data.kontakt.zeiten){
      const z=document.getElementById('zeiten');
      if(z) z.innerHTML = data.kontakt.zeiten.join('<br>');
    }
    // Formular-Optionen
    if(data.form && data.form.options){
      const sel=document.getElementById('f_kategorie');
      if(sel){
        sel.innerHTML='';
        data.form.options.forEach(o=>{
          const opt=document.createElement('option'); opt.value=o; opt.textContent=o; sel.appendChild(opt);
        });
      }
      const dsgvo=document.getElementById('dsgvoText');
      if(dsgvo) setText(dsgvo, data.form.dsgvo);
    }
  }

  /* ---------- Karten rendern ---------- */
  function renderCards(zelte){
    const wrap=document.getElementById('cards');
    if(!wrap) return;
    wrap.innerHTML='';
    zelte.forEach((z,i)=>{
      const card=document.createElement('article');
      card.className='card reveal';
      card.style.transitionDelay=(i*60)+'ms';
      card.innerHTML=
        '<div class="card-img"><img src="'+z.image+'" alt="'+z.name+'" loading="lazy">'+
        '<span class="card-tag">'+z.kategorie+'</span></div>'+
        '<div class="card-body"><h3>'+z.name+'</h3><ul>'+
        z.details.map(d=>'<li>'+d+'</li>').join('')+
        '</ul></div>';
      wrap.appendChild(card);
    });
  }

  /* ---------- Galerie rendern (mit Kategorie-Filter) ---------- */
  function renderGallery(gs){
    const wrap=document.getElementById('gallery');
    if(!wrap) return;
    wrap.innerHTML='';
    // Filter-Tabs bauen (Alle + eindeutige Kategorien in Original-Reihenfolge)
    const cats=[];
    gs.forEach(it=>{ if(it.category && cats.indexOf(it.category)<0) cats.push(it.category); });
    const filterBar=document.createElement('div');
    filterBar.className='gallery-filters';
    const mkBtn=(label,cat)=>{
      const b=document.createElement('button');
      b.type='button'; b.className='gfilter'+(cat===''?' active':'');
      b.textContent=label;
      b.onclick=()=>{
        filterBar.querySelectorAll('.gfilter').forEach(x=>x.classList.remove('active'));
        b.classList.add('active');
        wrap.querySelectorAll('.g-item').forEach(g=>{
          g.style.display=(cat===''||g.dataset.cat===cat)?'':'none';
        });
      };
      return b;
    };
    filterBar.appendChild(mkBtn('Alle',''));
    cats.forEach(c=>filterBar.appendChild(mkBtn(c,c)));
    wrap.parentNode.insertBefore(filterBar,wrap);

    gs.forEach((it,i)=>{
      const fig=document.createElement('figure');
      fig.className='g-item reveal';
      fig.dataset.cat=it.category||'';
      fig.style.transitionDelay=(i%8)*40+'ms';
      const badge=it.category?'<span class="g-badge">'+it.category+'</span>':'';
      fig.innerHTML=badge+'<img src="'+it.image+'" alt="'+it.name+'" loading="lazy"><figcaption>'+it.name+'</figcaption>';
      wrap.appendChild(fig);
    });
  }

  /* ---------- Partner rendern ---------- */
  function renderPartners(items){
    const wrap=document.getElementById('partnerRow');
    if(!wrap) return;
    wrap.innerHTML='';
    items.forEach(it=>{
      const div=document.createElement('div');
      div.className='partner-item reveal';
      div.innerHTML='<img src="'+it.image+'" alt="'+it.name+'">';
      wrap.appendChild(div);
    });
  }

  /* ---------- Scroll-Animation (IntersectionObserver) ---------- */
  function initReveal(){
    const obs=new IntersectionObserver((entries)=>{
      entries.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('visible'); obs.unobserve(e.target); } });
    },{threshold:0.12});
    document.querySelectorAll('.reveal').forEach(el=>obs.observe(el));
  }

  /* ---------- Navbar ---------- */
  function initNav(){
    const nav=document.getElementById('nav');
    const toggle=document.getElementById('navToggle');
    const links=document.getElementById('navLinks');
    const onScroll=()=>nav.classList.toggle('scrolled', window.scrollY>40);
    window.addEventListener('scroll',onScroll); onScroll();
    if(toggle&&links){
      toggle.addEventListener('click',()=>links.classList.toggle('open'));
      links.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>links.classList.remove('open')));
    }
  }

  /* ---------- Party-Partikel (Konfetti-Lichter) ---------- */
  function initParticles(){
    const c=document.getElementById('party-canvas');
    if(!c) return;
    const ctx=c.getContext('2d');
    let W,H,parts=[];
    const COLORS=['#7c3aed','#a855f7','#ec4899','#f59e0b','#2dd4bf'];
    function resize(){
      W=c.width=window.innerWidth; H=c.height=window.innerHeight;
    }
    resize(); window.addEventListener('resize',resize);
    const N=Math.min(90, Math.floor(W/14));
    for(let i=0;i<N;i++){
      parts.push({
        x:Math.random()*W, y:Math.random()*H,
        r:1.2+Math.random()*2.6,
        vx:(Math.random()-.5)*.35, vy:Math.random()*.22+.08,
        col:COLORS[Math.floor(Math.random()*COLORS.length)],
        a:Math.random()*.5+.25, tw:Math.random()*.02+.004
      });
    }
    function draw(){
      ctx.clearRect(0,0,W,H);
      parts.forEach(p=>{
        p.x+=p.vx; p.y+=p.vy;
        if(p.y>H+10){p.y=-10;p.x=Math.random()*W;}
        if(p.x>W+10)p.x=-10; if(p.x<-10)p.x=W+10;
        p.a+=p.tw;
        const alpha=0.2+Math.abs(Math.sin(p.a))*.6;
        ctx.globalAlpha=alpha;
        ctx.fillStyle=p.col;
        ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
        ctx.shadowBlur=8; ctx.shadowColor=p.col;
        ctx.fill();
      });
      ctx.globalAlpha=1;
      requestAnimationFrame(draw);
    }
    draw();
  }

  /* ---------- Formular (E-Mail-Versand) ---------- */
  function initForm(data){
    const form=document.getElementById('anfrageForm');
    const status=document.getElementById('formStatus');
    if(!form) return;

    form.addEventListener('submit',function(e){
      e.preventDefault();
      if(!form.checkValidity()){
        status.className='form-status err';
        status.textContent='Bitte füllen Sie alle Pflichtfelder aus.';
        return;
      }
      const email=(data.form&&data.form.mailto)||'info@ortenauer-zeltverleih.de';
      const vorname=document.getElementById('f_vorname').value;
      const nachname=document.getElementById('f_nachname').value;
      const mail=document.getElementById('f_email').value;
      const tel=document.getElementById('f_telefon').value;
      const ort=document.getElementById('f_ort').value;
      const kat=document.getElementById('f_kategorie').value;
      const nachr=document.getElementById('f_nachricht').value;

      // Betreff & Body sauber aufbauen
      const subject='Zeltanfrage: '+kat+' – '+vorname+' '+nachname;
      const body=
        'Neue Zeltanfrage über die Website\n============================\n\n'+
        'Name: '+vorname+' '+nachname+'\n'+
        'E-Mail: '+mail+'\n'+
        'Telefon: '+tel+'\n'+
        'Veranstaltungsort: '+(ort||'-')+'\n'+
        'Gewünschte Kategorie: '+kat+'\n\n'+
        'Nachricht:\n'+nachr+'\n'+
        '\n--\nDatum/Uhrzeit: '+new Date().toLocaleString('de-DE');

      // Öffne standardmäßig das Mail-Programm (funktioniert überall,
      // volle Kontrolle, keine externen Dienste nötig)
      const url='mailto:'+encodeURIComponent(email)+
        '?subject='+encodeURIComponent(subject)+
        '&body='+encodeURIComponent(body);
      if(window.confirm('Ihr E-Mail-Programm öffnet sich jetzt mit der fertig ausgefüllten Anfrage.\nMöchten Sie fortfahren?')){
        window.location.href=url;
      }
      status.className='form-status ok';
      status.textContent='Danke! Ihr E-Mail-Programm öffnet die fertige Anfrage. Alternativ senden Sie uns bitte eine E-Mail an '+email;
      form.reset();
    });
  }

  /* ---------- Init ---------- */
  async function init(){
    initParticles();
    initNav();
    initReveal();
    document.getElementById('year').textContent=new Date().getFullYear();
    try{
      const res=await fetch(CONTENT_URL,{cache:'no-store'});
      if(!res.ok) throw new Error('HTTP '+res.status);
      const data=await res.json();
      bindBase(data);
      if(data.zelte) renderCards(data.zelte);
      if(data.referenzen&&data.referenzen.items) renderGallery(data.referenzen.items);
      if(data.partner&&data.partner.items) renderPartners(data.partner.items);
      initForm(data);
      initReveal(); // neue .reveal Elemente beobachten
    }catch(err){
      console.error('Inhalt konnte nicht geladen werden:',err);
      document.getElementById('cards').innerHTML='<p>Inhalte konnten nicht geladen werden.</p>';
    }
  }

  document.addEventListener('DOMContentLoaded',init);
})();