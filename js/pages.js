/* ============================================================
   Seite-Page-Skript (Impressum/Datenschutz) – Nav-Toggle + Reveal
   ============================================================ */
(function(){
  'use strict';
  function onReady(fn){ if(document.readyState!=='loading') fn(); else document.addEventListener('DOMContentLoaded',fn); }
  onReady(function(){
    var toggle=document.getElementById('navToggle');
    var links=document.getElementById('navLinks');
    if(toggle&&links){
      toggle.addEventListener('click',function(){ links.classList.toggle('open'); });
      links.querySelectorAll('a').forEach(function(a){ a.addEventListener('click',function(){ links.classList.remove('open'); }); });
    }
  });
})();