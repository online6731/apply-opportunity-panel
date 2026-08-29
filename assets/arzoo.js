(function(){
  const button=document.getElementById("language-toggle");
  if(!button)return;
  function setLanguage(lang){
    const fa=lang==="fa";
    document.documentElement.lang=fa?"fa":"en";
    document.documentElement.dir=fa?"rtl":"ltr";
    document.body.classList.toggle("fa",fa);
    document.querySelectorAll("[data-en][data-fa]").forEach((node)=>{node.innerHTML=node.dataset[lang];});
    button.textContent=fa?"EN":"FA";
    button.setAttribute("aria-label",fa?"Switch to English":"تغییر زبان به فارسی");
    localStorage.setItem("ariidoch-language",lang);
  }
  setLanguage(localStorage.getItem("ariidoch-language")||"en");
  button.addEventListener("click",()=>setLanguage(document.body.classList.contains("fa")?"en":"fa"));
})();
