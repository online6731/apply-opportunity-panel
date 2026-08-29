(function(){
  const items=Array.isArray(window.OPPORTUNITIES)?window.OPPORTUNITIES:[];
  const fa=new Intl.NumberFormat("fa-IR");
  const esc=(v)=>String(v??"").replace(/[&<>'"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"})[c]);
  document.getElementById("report-total").textContent=fa.format(items.length);
  document.getElementById("report-open").textContent=fa.format(items.filter(x=>["open","rolling"].includes(x.status)).length);
  const typeLabels=window.TYPE_LABELS||{};const statusLabels=window.STATUS_LABELS||{};
  const people=[{id:"mohammad",label:"فرصت‌های محمد"},{id:"arzoo",label:"فرصت‌های آرزو"}];
  document.getElementById("report-groups").innerHTML=people.map(person=>{
    const list=items.filter(x=>x.person===person.id).sort((a,b)=>b.fit-a.fit);
    if(!list.length)return "";
    return `<section class="report-group"><h3>${person.label} <span>${fa.format(list.length)} مورد</span></h3><div class="report-table-wrap"><table class="report-table"><thead><tr><th>فرصت</th><th>سازمان / کشور</th><th>نوع</th><th>وضعیت</th><th>ددلاین</th><th>تطابق</th><th>منبع</th></tr></thead><tbody>${list.map(x=>`<tr><td>${esc(x.title)}</td><td>${esc(x.organization)}<br>${esc([x.country,x.location].filter(Boolean).join(" · "))}</td><td>${esc(typeLabels[x.type]||x.type)}</td><td><span class="status-pill ${esc(x.status)}">${esc(statusLabels[x.status]||x.status)}</span></td><td>${esc(x.deadlineLabel||"صفحه رسمی")}</td><td class="fit">${fa.format(x.fit)}٪</td><td><a href="${esc(x.url)}" target="_blank" rel="noreferrer">رسمی ↗</a></td></tr>`).join("")}</tbody></table></div></section>`;
  }).join("");
})();
