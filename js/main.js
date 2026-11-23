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
      const vorname=document.getElementById('f_vorname').value.trim();
      const nachname=document.getElementById('f_nachname').value.trim();
      const mail=document.getElementById('f_email').value.trim();
      const tel=document.getElementById('f_telefon').value.trim();
      const ort=document.getElementById('f_ort').value.trim();
      const kat=document.getElementById('f_kategorie').value;
      const nachr=document.getElementById('f_nachricht').value.trim();

      // Senden-Button deaktivieren während des Versands
      const btn=form.querySelector('button[type=submit]');
      const origBtn=btn.textContent;
      btn.disabled=true; btn.textContent='Wird gesendet…';
      status.className='form-status'; status.textContent='';

      // 1) Serverseitige Zustellung via FormSubmit (statischer GitHub-Pages-Host)
      const payload={
        _subject:'Zeltanfrage: '+kat+' – '+vorname+' '+nachname,
        _template:'table',
        _captcha:'false',
        'Name':vorname+' '+nachname,
        'E-Mail':mail,
        'Telefon':tel,
        'Veranstaltungsort':ort||'-',
        'Kategorie':kat,
        'Nachricht':nachr
      };
      // FormSubmit AJAX-Endpunkt (sendet als E-Mail an die Zieladresse)
      fetch('https://formsubmit.co/ajax/'+encodeURIComponent(email),{
        method:'POST',
        headers:{'Content-Type':'application/json','Accept':'application/json'},
        body:JSON.stringify(payload)
      }).then(function(res){
        return res.json();
      }).then(function(){
        status.className='form-status ok';
        status.textContent='Danke '+vorname+'! Ihre Anfrage wurde versendet. Wir melden uns schnellstmöglich. 🎉';
        form.reset();
        btn.disabled=false; btn.textContent=origBtn;
      }).catch(function(){
        // 2) Fallback: E-Mail-Programm öffnen (falls Netz des Besuchers blockiert)
        const subject='Zeltanfrage: '+kat+' – '+vorname+' '+nachname;
        const body='Name: '+vorname+' '+nachname+'\nE-Mail: '+mail+'\nTelefon: '+tel+'\nVeranstaltungsort: '+(ort||'-')+'\nKategorie: '+kat+'\n\nNachricht:\n'+nachr;
        const url='mailto:'+encodeURIComponent(email)+'?subject='+encodeURIComponent(subject)+'&body='+encodeURIComponent(body);
        status.className='form-status ok';
        status.textContent='Versand fehlgeschlagen – es öffnet sich Ihr E-Mail-Programm mit der fertigen Anfrage.';
        window.location.href=url;
        form.reset();
        btn.disabled=false; btn.textContent=origBtn;
      });
    });
  }

  /* ---------- Init ---------- */
  async function init(){
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