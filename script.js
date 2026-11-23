const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
let applying=false;const SYNC=['done','ta','tat','buka','log','skor','chk','ident'];
const store={get(k,d){try{const v=localStorage.getItem('fl_'+k);return v===null?d:JSON.parse(v)}catch(e){return d}},set(k,v){try{localStorage.setItem('fl_'+k,JSON.stringify(v))}catch(e){}if(!applying&&SYNC.includes(k)&&window.FL&&window.FL.onChange)window.FL.onChange();}};
const NAMA={mean:'Mean',median:'Median',gauss:'Gaussian'};

/* ===== Tema ===== */
function setTheme(t){document.documentElement.dataset.theme=t;store.set('theme',t);$$('.sw').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.th===t)));}
$$('.sw').forEach(b=>b.onclick=()=>setTheme(b.dataset.th));
const TEMA=['navy','graphite','emerald'],tSimpan=store.get('theme','navy');setTheme(TEMA.includes(tSimpan)?tSimpan:'navy');

/* ===== Mesin citra (dipakai beberapa halaman) ===== */
const N=96;let seed=7;
const rng=s=>()=>{s|=0;s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};
const orig=new Float32Array(N*N);
function genTest(){for(let y=0;y<N;y++)for(let x=0;x<N;x++){let v=60+x*0.9;if((x-34)**2+(y-36)**2<400)v=225;if(x>54&&x<84&&y>50&&y<80)v=30;if(Math.abs(x-y)<2&&x>8&&x<50)v=255;orig[y*N+x]=v;}}
genTest();
function addNoise(src,type,amt){
  const r=rng(seed),o=Float32Array.from(src);
  for(let i=0;i<o.length;i++){
    if(type==='g'){const u=r()||1e-9,v=r();o[i]=Math.min(255,Math.max(0,o[i]+Math.sqrt(-2*Math.log(u))*Math.cos(6.2832*v)*amt*2.5));}
    else{const p=r();if(p<amt/200)o[i]=0;else if(p>1-amt/200)o[i]=255;}
  }
  return o;
}
function filtrasi(src,f,k){
  const h=k>>1,o=new Float32Array(src.length);let w=null;
  if(f==='gauss'){const s=0.3*((k-1)*0.5-1)+0.8;w=[];let sum=0;for(let i=-h;i<=h;i++)for(let j=-h;j<=h;j++){const g=Math.exp(-(i*i+j*j)/(2*s*s));w.push(g);sum+=g;}w=w.map(g=>g/sum);}
  for(let y=0;y<N;y++)for(let x=0;x<N;x++){
    const a=[];
    for(let i=-h;i<=h;i++)for(let j=-h;j<=h;j++){const yy=Math.min(N-1,Math.max(0,y+i)),xx=Math.min(N-1,Math.max(0,x+j));a.push(src[yy*N+xx]);}
    o[y*N+x]=f==='median'?a.sort((p,q)=>p-q)[a.length>>1]:f==='mean'?a.reduce((s,v)=>s+v,0)/a.length:a.reduce((s,v,i)=>s+v*w[i],0);
  }
  return o;
}
const mse=(a,b)=>{let m=0;for(let i=0;i<a.length;i++)m+=(a[i]-b[i])**2;return m/a.length;};
const psnr=(a,b)=>{const m=mse(a,b);return m===0?Infinity:10*Math.log10(65025/m);};
function gambar(arr,id){const c=$('#'+id),x=c.getContext('2d'),d=x.createImageData(N,N);for(let i=0;i<arr.length;i++){const v=arr[i];d.data.set([v,v,v,255],i*4);}x.putImageData(d,0,0);}

/* ===== Navigasi & progres ===== */
const PAGES=['beranda','dasar','filter','simulasi','citra','lab','analisis','evaluasi','rangkuman'];
const JUDUL={dasar:'1. Dasar filtering',filter:'2. Jenis filter',simulasi:'3. Simulasi piksel',citra:'4. Eksperimen citra',lab:'5. Lab Python',analisis:'6. Analisis hasil',evaluasi:'7. Evaluasi',rangkuman:'8. Rangkuman'};
const BELAJAR=PAGES.slice(1);
let done=store.get('done',[]);
$('#peta').innerHTML=BELAJAR.map(p=>`<a href="#${p}"><b>${JUDUL[p]}</b></a>`).join('');
function progres(){
  const pct=Math.round(BELAJAR.filter(p=>done.includes(p)).length/BELAJAR.length*100);
  $('#pct').textContent=pct+'%';$('#fill').style.width=pct+'%';
  $$('.side nav a').forEach(a=>a.classList.toggle('done',done.includes(a.dataset.p)));
  $$('.done-btn').forEach(b=>b.textContent=done.includes(b.dataset.p)?'Selesai (klik untuk batal)':'Tandai selesai');
}
BELAJAR.forEach(p=>{
  const b=document.createElement('button');b.className='btn done-btn';b.dataset.p=p;
  b.onclick=()=>{done=done.includes(p)?done.filter(x=>x!==p):[...done,p];store.set('done',done);progres();};
  $('#'+p).appendChild(b);
});
function route(){
  const id=PAGES.includes(location.hash.slice(1))?location.hash.slice(1):'beranda';
  $$('.page').forEach(p=>p.hidden=p.id!==id);
  $$('.side nav a').forEach(a=>a.classList.toggle('on',a.dataset.p===id));
  document.body.classList.remove('open');window.scrollTo(0,0);
  document.title='FilterLab'+(JUDUL[id]?' | '+JUDUL[id]:'');
  if(id==='dasar')renderDasar();if(id==='citra')renderCitra();if(id==='analisis')renderLog();
}
addEventListener('hashchange',route);
$('#burger').onclick=()=>document.body.classList.toggle('open');
document.addEventListener('click',e=>{if(document.body.classList.contains('open')&&!e.target.closest('.side,#burger'))document.body.classList.remove('open');});
const ta=store.get('ta',{}),tat=store.get('tat',{});
function initTA(){$$('textarea[data-k]').forEach(t=>{t.value=ta[t.dataset.k]||'';pasangBahas(t);t.oninput=()=>{ta[t.dataset.k]=t.value;tat[t.dataset.k]=Date.now();store.set('tat',tat);store.set('ta',ta);syncBahas(t);};});}

/* ===== 1. Dasar ===== */
function renderDasar(){
  gambar(orig,'cvD');gambar(addNoise(orig,'g',10),'cvN1');gambar(addNoise(orig,'sp',10),'cvN2');
}
$('#cvD').addEventListener('click',e=>{
  const r=e.target.getBoundingClientRect(),x=Math.min(N-1,Math.floor((e.clientX-r.left)/r.width*N)),y=Math.min(N-1,Math.floor((e.clientY-r.top)/r.height*N));
  $('#pxInfo').textContent=`Piksel (x=${x}, y=${y}) bernilai ${Math.round(orig[y*N+x])} dari 255.`;
});

/* ===== 2. Jenis filter ===== */
const calc=(f,a)=>f==='median'?[...a].sort((x,y)=>x-y)[4]:Math.round(a.reduce((s,v,i)=>s+v*MODUL[f].k[i],0)/MODUL[f].d);
const MODUL={
 mean:{t:'Mean Filter',def:'Mean Filter (filter rata-rata) mengganti setiap piksel dengan rata-rata nilai pada jendelanya. Semua tetangga diperlakukan sama penting.',
  langkah:['Letakkan jendela 3 × 3 di atas piksel yang dihitung.','Jumlahkan kesembilan nilai piksel.','Bagi dengan 9, lalu bulatkan.','Geser jendela ke piksel berikutnya.'],
  rumus:'g(x, y) = (1 / k²) × Σ f(x + i, y + j)',k:[1,1,1,1,1,1,1,1,1],d:9,
  plus:['Sederhana dan sangat cepat.','Efektif meredam noise acak ringan.'],minus:['Tepi dan detail menjadi buram.','Nilai ekstrem seperti 255 menarik rata-rata, sehingga salt-and-pepper tidak hilang melainkan menyebar.'],
  cocok:'Noise Gaussian ringan dan penghalusan cepat.',cv:'cv2.blur(img, (k, k))'},
 median:{t:'Median Filter',def:'Median Filter mengganti setiap piksel dengan nilai tengah dari semua nilai pada jendelanya. Karena hanya mengambil nilai tengah, nilai ekstrem otomatis terabaikan.',
  langkah:['Ambil kesembilan nilai pada jendela 3 × 3.','Urutkan dari terkecil ke terbesar.','Ambil nilai ke-5 (nilai tengah).','Jadikan nilai itu piksel keluaran.'],
  rumus:'g(x, y) = median{ f(x + i, y + j) }',k:null,
  plus:['Sangat baik untuk salt-and-pepper.','Menjaga tepi lebih baik daripada Mean.','Hasilnya selalu berupa nilai yang ada di citra asli.'],minus:['Lebih lambat karena perlu mengurutkan.','Kurang efektif untuk noise Gaussian.','Kernel besar dapat menghapus garis tipis dan detail kecil.'],
  cocok:'Salt-and-pepper, misalnya hasil pindai dokumen berbintik.',cv:'cv2.medianBlur(img, k)'},
 gauss:{t:'Gaussian Filter',def:'Gaussian Filter merata-ratakan jendela dengan bobot mengikuti kurva lonceng: piksel pusat paling berpengaruh, makin jauh makin kecil.',
  langkah:['Siapkan kernel berbobot (pada 3 × 3: 1 2 1 / 2 4 2 / 1 2 1).','Kalikan tiap nilai piksel dengan bobot yang bersesuaian.','Jumlahkan semua hasil kali.','Bagi dengan jumlah bobot (16), lalu bulatkan.'],
  rumus:'G(i, j) = exp( -(i² + j²) / (2σ²) ), kemudian dinormalkan agar jumlah bobot = 1',k:[1,2,1,2,4,2,1,2,1],d:16,
  plus:['Penghalusan terasa alami dan tidak berundak.','Cocok untuk noise Gaussian.','Parameter σ dapat diatur untuk kekuatan penghalusan.'],minus:['Tepi tetap sedikit buram.','Kurang baik untuk salt-and-pepper.'],
  cocok:'Foto cahaya redup dan tahap awal sebelum deteksi tepi.',cv:'cv2.GaussianBlur(img, (k, k), 0)'}
};
const EX=[59,55,104,65,255,70,64,70,60];
function contoh(f){
  const m=MODUL[f],s=[...EX].sort((a,b)=>a-b);
  if(f==='median')return `Jendela: ${EX.join(', ')}. Diurutkan: ${s.join(', ')}. Nilai ke-5 = <b>${calc(f,EX)}</b>.`;
  const t=EX.reduce((a,v,i)=>a+v*m.k[i],0);
  const rumus=f==='mean'?EX.join(' + '):EX.map((v,i)=>`${m.k[i]}×${v}`).join(' + ');
  return `${rumus} = ${t}. Dibagi ${m.d} = ${(t/m.d).toFixed(2)}, dibulatkan menjadi <b>${calc(f,EX)}</b>.`;
}
function showModul(k){
  const m=MODUL[k];
  const kern=m.k?`<div class="grid k">${m.k.map(v=>`<div class="cell">${v}/${m.d}</div>`).join('')}</div>`:'<p>Median tidak memakai bobot; operasinya berupa pengurutan nilai.</p>';
  $('#panel').innerHTML=`<div class="box"><h3>${m.t}</h3><p>${m.def}</p><h3>Cara kerja</h3><ol class="plain">${m.langkah.map(l=>`<li>${l}</li>`).join('')}</ol><h3>Rumus</h3><div class="formula">${esc(m.rumus)}</div><h3>Kernel 3 × 3</h3>${kern}<h3>Contoh perhitungan</h3><p>Jendela pada piksel tengah data salt-and-pepper di halaman simulasi; angka 255 adalah noise.</p><div class="formula">${contoh(k)}</div></div>
  <div class="two"><div class="box"><h3>Kelebihan</h3><ul class="good">${m.plus.map(l=>`<li>${l}</li>`).join('')}</ul></div><div class="box"><h3>Kekurangan</h3><ul class="bad">${m.minus.map(l=>`<li>${l}</li>`).join('')}</ul></div></div>
  <div class="box"><h3>Kapan dipakai</h3><p>${m.cocok}</p><span class="tag">${esc(m.cv)}</span></div>`;
}
$$('#tabsFilter .tab').forEach(b=>b.onclick=()=>{$$('#tabsFilter .tab').forEach(x=>x.classList.remove('on'));b.classList.add('on');showModul(b.dataset.t);});
showModul('mean');

/* ===== 3. Simulasi piksel ===== */
const PRESET={
 sp:[[52,55,61,59,79],[62,59,55,104,94],[63,65,255,70,68],[58,64,70,60,56],[60,62,68,64,59]],
 gs:[[52,58,49,61,55],[47,66,54,63,50],[59,51,70,48,60],[56,62,45,67,53],[50,57,64,52,58]],
 edge:[[40,42,200,198,201],[41,39,202,199,200],[43,40,198,201,199],[40,44,200,200,197],[42,41,203,199,200]]
};
let IMG=PRESET.sp,sel=[2,2],flt='mean';
const area=(r,c)=>{const a=[];for(let i=-1;i<=1;i++)for(let j=-1;j<=1;j++)a.push(IMG[r+i][c+j]);return a;};
const hit=(f,r,c)=>calc(f,area(r,c));
function simUpdate(){
  const [r,c]=sel,a=area(r,c),m=MODUL[flt],out=hit(flt,r,c),s=[...a].sort((x,y)=>x-y);
  $('#grid').innerHTML='';
  IMG.forEach((row,i)=>row.forEach((v,j)=>{
    const d=document.createElement('button'),edge=i%4===0||j%4===0;
    d.className='cell'+(v===255?' salt':'')+(Math.abs(i-r)<=1&&Math.abs(j-c)<=1?' nb':'')+(i===r&&j===c?' sel':'');
    d.textContent=v;d.disabled=edge;if(edge)d.title='Piksel tepi tidak dihitung';else d.onclick=()=>{sel=[i,j];simUpdate();};
    $('#grid').appendChild(d);
  }));
  $('#kernel').innerHTML=flt==='median'?s.map(v=>`<div class="cell">${v}</div>`).join(''):m.k.map(v=>`<div class="cell">${v}/${m.d}</div>`).join('');
  $('#langkah').innerHTML=`Piksel (${r+1},${c+1}) bernilai awal <b>${IMG[r][c]}</b>. `+(flt==='median'?`Urutkan sembilan nilai jendela; nilai ke-5 adalah <b>${out}</b>.`:`Kalikan setiap nilai dengan bobotnya, jumlahkan, lalu bagi ${m.d}. Hasilnya <b>${out}</b>.`);
  if(flt==='median')$('#tabelHit').innerHTML=`<table class="wk"><tr><th>Urutan</th>${s.map((_,i)=>`<td>${i+1}</td>`).join('')}</tr><tr><th>Nilai</th>${s.map((v,i)=>i===4?`<td><b>${v}</b></td>`:`<td>${v}</td>`).join('')}</tr></table>`;
  else{const t=a.reduce((x,v,i)=>x+v*m.k[i],0);$('#tabelHit').innerHTML=`<table class="wk"><tr><th>Nilai</th>${a.map(v=>`<td>${v}</td>`).join('')}</tr><tr><th>Bobot</th>${m.k.map(v=>`<td>${v}</td>`).join('')}</tr><tr><th>Hasil kali</th>${a.map((v,i)=>`<td>${v*m.k[i]}</td>`).join('')}</tr></table><p>Jumlah = ${t}; ${t} / ${m.d} = ${(t/m.d).toFixed(2)}.</p>`;}
  $('#banding').innerHTML=['mean','median','gauss'].map(f=>`<div class="bar ${f}"><span>${NAMA[f]}</span><span>${hit(f,r,c)}</span></div>`).join('');
  let g='';for(let i=1;i<=3;i++)for(let j=1;j<=3;j++)g+=`<div class="cell${i===r&&j===c?' sel':''}">${hit(flt,i,j)}</div>`;
  $('#hasilGrid').innerHTML=g;
}
$$('#pilih .tab').forEach(b=>b.onclick=()=>{$$('#pilih .tab').forEach(x=>x.classList.remove('on'));b.classList.add('on');flt=b.dataset.f;simUpdate();});
$('#preset').onchange=e=>{IMG=PRESET[e.target.value];simUpdate();};
simUpdate();

/* ===== 4. Eksperimen citra ===== */
let last=null;
function renderCitra(){
  const type=$('#cNoise').value,amt=+$('#cAmt').value,f=$('#cFilter').value,k=+$('#cK').value;
  $('#oAmt').textContent=amt;
  const noisy=addNoise(orig,type,amt),res={};
  ['mean','median','gauss'].forEach(g=>res[g]=filtrasi(noisy,g,k));
  const out=res[f],diff=new Float32Array(out.length);
  for(let i=0;i<out.length;i++)diff[i]=Math.min(255,Math.abs(orig[i]-out[i])*4);
  gambar(orig,'cv0');gambar(noisy,'cv1');gambar(out,'cv2');gambar(diff,'cv3');
  const fmt=v=>isFinite(v)?v.toFixed(2)+' dB':'tak hingga';
  const rows=['mean','median','gauss'].map(g=>({g,v:psnr(orig,res[g])})),best=Math.max(...rows.map(r=>r.v));
  $('#metrik').innerHTML=`<div class="bar mean"><span>Citra bernoise</span><span>${fmt(psnr(orig,noisy))}</span></div>`+rows.map(r=>`<div class="bar ${r.g}"><span>${NAMA[r.g]} (kernel ${k})${r.v===best?' - terbaik':''}</span><span>${fmt(r.v)}</span></div>`).join('');
  last={noise:type==='g'?'Gaussian':'Salt-and-pepper',amt,f:NAMA[f],k,mse:mse(orig,out),psnr:psnr(orig,out)};
}
['cNoise','cAmt','cFilter','cK'].forEach(i=>$('#'+i).addEventListener('input',renderCitra));
$('#cSeed').onclick=()=>{seed=Math.floor(Math.random()*1e6);renderCitra();};
$('#cSave').onclick=()=>{
  if(!last)return;const log=store.get('log',[]);log.push(last);store.set('log',log.slice(-30));
  $('#cSave').textContent='Tersimpan ('+Math.min(log.length,30)+')';setTimeout(()=>$('#cSave').textContent='Simpan ke log',1500);
};
$('#cSrc').onchange=e=>{const u=e.target.value==='unggah';$('#lblFile').hidden=!u;if(!u){genTest();renderCitra();}};
$('#cFile').onchange=e=>{
  const file=e.target.files[0];if(!file)return;
  const img=new Image(),url=URL.createObjectURL(file);
  img.onload=()=>{const c=document.createElement('canvas');c.width=c.height=N;const x=c.getContext('2d'),s=Math.min(img.width,img.height);
    x.drawImage(img,(img.width-s)/2,(img.height-s)/2,s,s,0,0,N,N);const d=x.getImageData(0,0,N,N).data;
    for(let i=0;i<N*N;i++)orig[i]=0.299*d[i*4]+0.587*d[i*4+1]+0.114*d[i*4+2];
    URL.revokeObjectURL(url);$('#cInfo').textContent='Gambar dimuat sebagai grayscale 96 × 96 piksel.';renderCitra();};
  img.onerror=()=>{$('#cInfo').textContent='Berkas tidak dapat dibaca sebagai gambar.';};
  img.src=url;
};

/* ===== 5. Lab Python ===== */
const LAB=[
 {j:'Memuat gambar',tujuan:'Membaca citra dengan OpenCV, mengonversi warna, dan menampilkan ukuran serta tipe datanya.',teori:'OpenCV membaca citra sebagai array NumPy berurutan BGR. Matplotlib mengharapkan RGB, sehingga perlu konversi sebelum ditampilkan.',
  kode:"import cv2, numpy as np\nimport matplotlib.pyplot as plt\nfrom google.colab import files\n\nfiles.upload()  # pilih gambar, misalnya gambar.png\nimage = cv2.imread('gambar.png')\nimage = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)\nprint(image.shape, image.dtype)\nplt.imshow(image); plt.axis('off'); plt.show()",
  langkah:['Jalankan sel dan unggah satu gambar.','Pastikan nama berkas sama dengan yang ditulis pada cv2.imread.','Catat nilai image.shape (tinggi, lebar, kanal).'],param:'Nama berkas gambar.',tanya:'Berapa jumlah piksel gambarmu, dan berapa kanal warnanya?'},
 {j:'Menambah noise',tujuan:'Membuat dua versi citra bernoise sebagai bahan uji filter.',teori:'Noise Gaussian ditambahkan dari distribusi normal dengan simpangan baku sigma. Salt-and-pepper mengubah sebagian piksel secara acak menjadi 0 atau 255.',
  kode:"def gaussian_noise(img, sigma=25):\n    n = np.random.normal(0, sigma, img.shape)\n    return np.clip(img + n, 0, 255).astype(np.uint8)\n\ndef salt_pepper(img, p=0.05):\n    out = img.copy()\n    m = np.random.rand(*img.shape[:2])\n    out[m < p/2] = 0\n    out[m > 1 - p/2] = 255\n    return out\n\nnoisy_g  = gaussian_noise(image, sigma=25)  # UBAH sigma\nnoisy_sp = salt_pepper(image, p=0.05)       # UBAH p",
  langkah:['Jalankan kedua fungsi.','Tampilkan noisy_g dan noisy_sp berdampingan.','Naikkan sigma dan p, lalu amati perubahannya.'],param:'sigma (mis. 10, 25, 50) dan p (mis. 0.02, 0.05, 0.10).',tanya:'Pada nilai berapa noise mulai mengganggu pengenalan objek di gambarmu?'},
 {j:'Mean Filter',tujuan:'Menerapkan Mean Filter dan melihat pengaruh ukuran kernel.',teori:'Mean Filter merata-ratakan piksel dalam jendela k × k; cv2.blur melakukannya dengan kernel berbobot sama.',
  kode:"k = 3  # UBAH: 3, 5, atau 7\nmean_g  = cv2.blur(noisy_g,  (k, k))\nmean_sp = cv2.blur(noisy_sp, (k, k))\n\nfig, ax = plt.subplots(1, 3, figsize=(12, 4))\nfor a, im, t in zip(ax, [noisy_sp, mean_sp, mean_g], ['Noise SP', 'Mean pada SP', 'Mean pada Gaussian']):\n    a.imshow(im); a.set_title(t); a.axis('off')\nplt.show()",
  langkah:['Jalankan dengan k = 3.','Ulangi dengan k = 5 dan k = 7.','Perhatikan bintik putih dan hitam pada hasil SP.'],param:'Ukuran kernel k.',tanya:'Apakah bintik salt-and-pepper hilang setelah Mean Filter? Jelaskan alasannya.'},
 {j:'Median Filter',tujuan:'Menerapkan Median Filter dan membandingkannya dengan Mean pada salt-and-pepper.',teori:'Median mengambil nilai tengah dari k × k piksel sehingga nilai ekstrem terbuang. Ukuran kernel harus ganjil.',
  kode:"median_sp = cv2.medianBlur(noisy_sp, k)\nmedian_g  = cv2.medianBlur(noisy_g,  k)\n\nfig, ax = plt.subplots(1, 3, figsize=(12, 4))\nfor a, im, t in zip(ax, [noisy_sp, median_sp, median_g], ['Noise SP', 'Median pada SP', 'Median pada Gaussian']):\n    a.imshow(im); a.set_title(t); a.axis('off')\nplt.show()",
  langkah:['Gunakan nilai k yang sama dengan praktikum 3.','Bandingkan hasil Median dan Mean pada citra SP.','Perhatikan kejernihan tepi objek.'],param:'Ukuran kernel k (ganjil).',tanya:'Mengapa Median jauh lebih bersih pada citra salt-and-pepper?'},
 {j:'Gaussian Filter',tujuan:'Menerapkan Gaussian Filter dan memahami peran parameter sigma.',teori:'Gaussian memberi bobot menurun dari pusat. Jika sigma bernilai 0, OpenCV menghitungnya dari ukuran kernel.',
  kode:"gauss_g  = cv2.GaussianBlur(noisy_g,  (k, k), 0)\ngauss_sp = cv2.GaussianBlur(noisy_sp, (k, k), 0)\n\n# Eksperimen sigma (opsional)\nsig = 1.5  # UBAH\ngauss_s = cv2.GaussianBlur(noisy_g, (k, k), sig)",
  langkah:['Jalankan dengan sigma otomatis (0).','Coba sigma 0.5, 1.5, dan 3.','Bandingkan dengan Mean pada citra Gaussian.'],param:'Ukuran kernel k dan sigma.',tanya:'Apa bedanya hasil Gaussian dan Mean pada citra bernoise Gaussian?'},
 {j:'Kernel dan perbandingan kuantitatif',tujuan:'Membandingkan ketiga filter secara objektif dengan PSNR pada beberapa ukuran kernel.',teori:'PSNR membandingkan hasil dengan citra asli: makin tinggi makin baik. Bandingkan pada jenis noise yang sama dan kernel yang sama.',
  kode:"hasil = []\nfor nama, noisy in [('Gaussian', noisy_g), ('SP', noisy_sp)]:\n    for k in (3, 5, 7):\n        for f, fn in [('Mean', lambda x: cv2.blur(x, (k, k))),\n                      ('Median', lambda x: cv2.medianBlur(x, k)),\n                      ('Gaussian', lambda x: cv2.GaussianBlur(x, (k, k), 0))]:\n            hasil.append((nama, k, f, round(cv2.PSNR(image, fn(noisy)), 2)))\nfor h in hasil: print(h)",
  langkah:['Jalankan sel dan salin tabel hasilnya ke lembar kerjamu.','Tentukan filter terbaik untuk tiap jenis noise.','Cari ukuran kernel yang PSNR-nya tertinggi.'],param:'Daftar ukuran kernel dan tingkat noise.',tanya:'Untuk tiap jenis noise, filter dan ukuran kernel mana yang terbaik? Apakah kernel terbesar selalu menang?'}
];
$('#praktikum').innerHTML=LAB.map((l,i)=>`<details><summary>Praktikum ${i+1}: ${l.j}</summary><p><b>Tujuan:</b> ${l.tujuan}</p><p><b>Dasar teori singkat:</b> ${l.teori}</p><pre><code>${esc(l.kode)}</code></pre><button class="btn small" data-i="${i}">Salin kode</button><p><b>Langkah:</b></p><ol class="plain">${l.langkah.map(s=>`<li>${s}</li>`).join('')}</ol><p><b>Parameter yang boleh diubah:</b> ${l.param}</p><p><b>Pertanyaan analisis:</b> ${l.tanya}</p></details>`).join('');
$$('#praktikum button').forEach(b=>b.onclick=()=>{if(navigator.clipboard)navigator.clipboard.writeText(LAB[b.dataset.i].kode).then(()=>{b.textContent='Tersalin';setTimeout(()=>b.textContent='Salin kode',1500);});});

/* ===== 6. Analisis ===== */
function renderLog(){
  const log=store.get('log',[]);
  $('#logTbl tbody').innerHTML=log.map((e,i)=>`<tr><td>${i+1}</td><td>${e.noise}</td><td>${e.amt}%</td><td>${e.f}</td><td>${e.k}</td><td>${e.mse.toFixed(1)}</td><td>${isFinite(e.psnr)?e.psnr.toFixed(2):'tak hingga'} dB</td></tr>`).join('');
  $('#logKosong').hidden=log.length>0;$('#logTbl').parentElement.hidden=log.length===0;$('#logHapus').hidden=log.length===0;
}
$('#logHapus').onclick=()=>{store.set('log',[]);renderLog();};
const ESSAY=['Filter mana yang paling sesuai untuk salt-and-pepper noise? Jelaskan dengan angka PSNR dari log eksperimenmu.','Filter mana yang paling sesuai untuk noise Gaussian? Sebutkan selisih PSNR-nya dengan filter lain.','Bagaimana ukuran kernel memengaruhi hasil citra dan nilai PSNR? Bandingkan minimal dua ukuran kernel dari log.','Apa kesimpulanmu tentang memilih filter berdasarkan jenis noise?'];
$('#essay').innerHTML=ESSAY.map((q,i)=>`<div class="box"><p><b>${i+1}. ${q}</b></p><textarea data-k="e${i}" placeholder="Tulis analisismu di sini"></textarea></div>`).join('');

/* ===== 7. Evaluasi ===== */
const SOAL=[
 {t:'mc',q:'Filter yang paling sesuai untuk salt-and-pepper noise adalah...',o:['Mean','Median','Gaussian'],a:1,e:'Median mengabaikan nilai ekstrem, sedangkan Mean ikut tertarik olehnya.'},
 {t:'mc',q:'Untuk noise Gaussian pada foto cahaya redup, pilihan yang paling wajar adalah...',o:['Gaussian Filter','Tidak perlu filter','Median dengan kernel 9'],a:0,e:'Gaussian Filter menghaluskan acak halus secara alami tanpa menghapus detail terlalu banyak.'},
 {t:'mc',q:'Memperbesar ukuran kernel akan...',o:['Mempertajam citra','Membuat citra lebih buram','Tidak mengubah hasil'],a:1,e:'Jendela lebih luas mencampur lebih banyak tetangga sehingga detail hilang.'},
 {t:'mc',q:'Pada kernel Gaussian 3 × 3, bobot terbesar dimiliki oleh...',o:['Piksel pojok','Piksel pusat','Semua piksel sama'],a:1,e:'Bobot menurun menjauhi pusat mengikuti kurva Gaussian (pusat bernilai 4 dari 16).'},
 {t:'mc',q:'Manakah filter non-linear?',o:['Mean','Gaussian','Median'],a:2,e:'Median bekerja dengan mengurutkan nilai, bukan menjumlahkan bobot.'},
 {t:'mc',q:'Syarat ukuran kernel pada cv2.medianBlur adalah...',o:['Genap','Ganjil dan lebih dari 1','Harus 3'],a:1,e:'Ukuran ganjil memastikan ada satu piksel pusat; contohnya 3, 5, 7.'},
 {t:'num',q:'Jendela 3 × 3: 12, 15, 14, 13, 255, 16, 11, 15, 14. Berapa hasil Median Filter?',ans:14,tol:0,e:'Diurutkan: 11,12,13,14,14,15,15,16,255. Nilai ke-5 adalah 14.'},
 {t:'num',q:'Untuk jendela yang sama, berapa hasil Mean Filter (bulatkan ke bilangan bulat)?',ans:40.56,tol:0.5,e:'Jumlah = 365, dibagi 9 = 40,56, dibulatkan 41. Perhatikan betapa 255 menaikkan hasilnya.'},
 {t:'num',q:'Jika MSE = 100 untuk citra 8 bit, berapa PSNR dalam dB? (dua desimal)',ans:28.13,tol:0.05,e:'PSNR = 10 × log10(65025 / 100) = 10 × log10(650,25) = 28,13 dB.'},
 {t:'mc',q:'Studi kasus: hasil pindai dokumen penuh bintik hitam-putih acak. Filter terbaik?',o:['Median','Mean 7 × 7','Gaussian 7 × 7'],a:0,e:'Bintik hitam-putih adalah salt-and-pepper; Median membuangnya tanpa memburamkan teks.'},
 {t:'mc',q:'Studi kasus: foto malam ISO tinggi tampak berbutir halus merata. Pilihan paling tepat?',o:['Median 7 × 7','Gaussian 3 × 3','Tidak perlu filter'],a:1,e:'Butiran halus merata adalah noise Gaussian; kernel kecil menjaga detail.'}
];
let benar=0,jawab=0;
function selesaiSatu(box,ok,e){
  box.dataset.done=1;jawab++;if(ok)benar++;
  $('.fb',box).textContent=(ok?'Tepat. ':'Belum tepat. ')+e;
  if(jawab===SOAL.length){const p=Math.round(benar/SOAL.length*100);$('#skor').textContent=`Skor kamu ${benar} dari ${SOAL.length} (${p}).`;store.set('skor',benar);}
}
function kuis(){
  benar=0;jawab=0;$('#skor').textContent='Jawab semua soal untuk melihat skor.';
  $('#kuis').innerHTML=SOAL.map((s,i)=>`<div class="box q" data-i="${i}"><p>${i+1}. ${s.q}</p>`+(s.t==='mc'?s.o.map((t,j)=>`<button class="opt" data-j="${j}">${t}</button>`).join(''):`<div class="row"><input type="number" step="any" aria-label="Jawaban soal ${i+1}"><button class="btn small chk-btn">Periksa</button></div>`)+'<p class="fb"></p></div>').join('');
  $$('#kuis .q').forEach(box=>{
    const s=SOAL[box.dataset.i];
    if(s.t==='mc')$$('.opt',box).forEach(b=>b.onclick=()=>{
      if(box.dataset.done)return;const ok=+b.dataset.j===s.a;
      b.classList.add(ok?'ok':'no');if(!ok)$$('.opt',box)[s.a].classList.add('ok');selesaiSatu(box,ok,s.e);
    });
    else $('.chk-btn',box).onclick=()=>{
      if(box.dataset.done)return;const v=parseFloat($('input',box).value.replace(',','.'));if(isNaN(v)){$('.fb',box).textContent='Isi angka terlebih dahulu.';return;}
      selesaiSatu(box,Math.abs(v-s.ans)<=s.tol+1e-9,s.e);
    };
  });
}
$('#ulang').onclick=kuis;kuis();

/* ===== 8. Rangkuman ===== */
const CEK=['Saya dapat menjelaskan perbedaan noise Gaussian dan salt-and-pepper.','Saya dapat menghitung hasil Mean, Median, dan Gaussian pada jendela 3 × 3.','Saya tahu mengapa Median unggul pada salt-and-pepper.','Saya dapat menjalankan ketiga filter di Python dan mengubah ukuran kernel.','Saya dapat membaca MSE dan PSNR untuk membandingkan hasil.','Saya dapat memilih filter yang tepat untuk suatu kasus.'];
let chk=store.get('chk',[]);
$('#ceklis').innerHTML=CEK.map((t,i)=>`<label class="chk"><input type="checkbox" data-i="${i}"${chk.includes(i)?' checked':''}><span>${t}</span></label>`).join('');
$$('#ceklis input').forEach(c=>c.onchange=()=>{const i=+c.dataset.i;chk=c.checked?[...new Set([...chk,i])]:chk.filter(x=>x!==i);store.set('chk',chk);});
const GLOS=[['Piksel','Elemen terkecil citra digital yang menyimpan satu nilai intensitas.'],['Grayscale','Citra satu kanal dengan nilai 0 (hitam) sampai 255 (putih).'],['Noise','Gangguan acak pada nilai piksel yang tidak ada pada objek aslinya.'],['Noise Gaussian','Noise yang bergeser sedikit pada setiap piksel mengikuti distribusi normal.'],['Salt-and-pepper','Noise berupa piksel yang berubah ekstrem menjadi 0 atau 255.'],['Jendela','Kumpulan piksel sekitar sebuah piksel yang ikut dihitung, misalnya 3 × 3.'],['Kernel','Matriks bobot kecil yang digeser pada citra untuk menghitung keluaran (disebut juga mask).'],['Konvolusi','Operasi menjumlahkan hasil kali nilai piksel dengan bobot kernel pada setiap posisi.'],['Padding','Penambahan piksel semu di tepi citra agar jendela selalu lengkap.'],['Mean Filter','Filter yang mengganti piksel dengan rata-rata jendelanya.'],['Median Filter','Filter yang mengganti piksel dengan nilai tengah jendelanya.'],['Gaussian Filter','Filter rata-rata berbobot yang bobotnya menurun dari pusat.'],['MSE','Rata-rata kuadrat selisih piksel antara citra asli dan hasil.'],['PSNR','Ukuran kualitas dalam desibel; makin tinggi makin dekat ke citra asli.']];
function glos(q=''){
  const f=GLOS.filter(g=>(g[0]+' '+g[1]).toLowerCase().includes(q.toLowerCase()));
  $('#glos').innerHTML=f.length?f.map(g=>`<dt>${g[0]}</dt><dd>${g[1]}</dd>`).join(''):'<dd>Istilah tidak ditemukan.</dd>';
}
$('#cari').oninput=e=>glos(e.target.value);glos();


/* ===== Pembahasan acuan (terbuka setelah menjawab) ===== */
const li=a=>'<ul class="plain">'+a.map(x=>`<li>${x}</li>`).join('')+'</ul>';
const KUNCI={
 d1:{html:li(['Gaussian: butiran halus merata di seluruh citra karena setiap piksel bergeser sedikit.','Salt-and-pepper: sebagian kecil piksel menjadi titik hitam atau putih ekstrem, sisanya tetap bersih.'])},
 d2:{html:li(['Salt-and-pepper umumnya lebih mudah dikenali karena bintik ekstrem sangat kontras dengan sekitarnya.','Gaussian tingkat rendah sulit terlihat dan baru jelas pada tingkat tinggi atau area datar.'])},
 d3:{html:li(['Tepi menjadi buram karena jendela mencampur piksel dari kedua sisi tepi.','Semakin besar jendela, semakin lebar zona buram dan semakin hilang detail halus.'])},
 s1:{html:'<p>Pada piksel pusat data salt-and-pepper, Mean menghasilkan <b>89</b> dan Median <b>65</b>.</p>'+li(['Mean menjumlahkan semua nilai, sehingga 255 ikut menarik hasil ke atas (jumlah 802 dibagi 9).','Median hanya mengambil nilai urutan ke-5; 255 berada di ujung urutan sehingga tidak berpengaruh.','Karena itu Median dipilih untuk salt-and-pepper.'])},
 e0:{html:li(['Menyebut Median sebagai filter yang paling sesuai.','Menyertakan angka PSNR dari log sebagai bukti, dibandingkan dengan Mean atau Gaussian pada noise dan kernel yang sama.','Menjelaskan alasannya: Median mengabaikan nilai ekstrem, Mean dan Gaussian menyebarkannya.'])},
 e1:{html:li(['Pada noise Gaussian, Mean dan Gaussian umumnya lebih baik daripada Median; hasil bergantung pada citra dan tingkat noise, jadi jawab sesuai datamu.','Menyebut selisih PSNR dengan angka dari log.','Menyinggung kompromi: Mean meredam lebih kuat tetapi lebih memburamkan tepi, Gaussian lebih menjaga detail.'])},
 e2:{html:li(['Kernel lebih besar meredam noise lebih kuat tetapi membuat tepi dan detail buram.','PSNR sering naik lalu turun saat kernel diperbesar, sehingga ada ukuran yang paling pas.','Membandingkan setidaknya dua baris log dengan kernel berbeda dan menyebut angkanya.'])},
 e3:{html:li(['Salt-and-pepper: Median. Noise Gaussian: Gaussian atau Mean dengan kernel kecil.','Pilih kernel sekecil mungkin yang sudah cukup meredam noise.','Verifikasi dengan PSNR dan pengamatan visual, bukan salah satunya saja.'])}
};
const TANYA={d1:'Perbedaan tampilan citra bernoise Gaussian dan salt-and-pepper',d2:'Citra mana yang noise-nya lebih mudah dikenali dengan mata, dan mengapa',d3:'Apa yang terjadi pada tepi objek ketika jendela filter diperbesar',s1:'Mengapa hasil Mean dan Median pada piksel pusat data salt-and-pepper berbeda jauh'};
ESSAY.forEach((q,i)=>TANYA['e'+i]=q);
let buka=store.get('buka',[]);
function pasangBahas(t){
  const k=t.dataset.k,kc=KUNCI[k];if(!kc)return;
  const w=document.createElement('div');w.className='bahas';
  w.innerHTML=`<div class="row"><button type="button" class="btn small alt">Lihat pembahasan</button><span class="hint">Tulis jawabanmu dulu (minimal 20 karakter) untuk membuka pembahasan.</span></div><div class="kunci" hidden><h4>Poin acuan</h4>${kc.html}<p class="hint">Ini acuan, bukan satu-satunya jawaban benar. Bandingkan dengan jawabanmu dan lengkapi bagian yang terlewat.</p></div>`;
  t.after(w);
  const btn=$('button',w),box=$('.kunci',w),hint=$('.hint',w);
  const tampil=()=>{const o=buka.includes(k);box.hidden=!o;btn.textContent=o?'Sembunyikan pembahasan':'Lihat pembahasan';};
  btn.onclick=()=>{buka=buka.includes(k)?buka.filter(x=>x!==k):[...buka,k];store.set('buka',buka);tampil();syncBahas(t);};
  t._b={btn,hint,tampil};tampil();syncBahas(t);
}
function syncBahas(t){const b=t._b;if(!b)return;const ok=t.value.trim().length>=20,o=buka.includes(t.dataset.k);b.btn.disabled=!(ok||o);b.hint.hidden=ok||o;}

/* ===== Ekspor laporan ===== */
const ident=store.get('ident',{});
$('#exNama').value=ident.n||'';$('#exNim').value=ident.i||'';
['exNama','exNim'].forEach(id=>$('#'+id).oninput=()=>{store.set('ident',{n:$('#exNama').value,i:$('#exNim').value});});
function laporan(){
  const sk=store.get('skor',null),log=store.get('log',[]),T=[];
  T.push('LAPORAN BELAJAR FILTERLAB','Nama: '+($('#exNama').value.trim()||'-'),'NIM: '+($('#exNim').value.trim()||'-'),'Tanggal: '+new Date().toLocaleDateString('id-ID'),'Progres: '+$('#pct').textContent,'Skor evaluasi: '+(sk===null?'belum dikerjakan':sk+' dari '+SOAL.length),'','JAWABAN PERTANYAAN');
  Object.keys(TANYA).forEach((k,i)=>T.push(`${i+1}. ${TANYA[k]}`,'Jawaban: '+((ta[k]||'').trim()||'(belum dijawab)'),''));
  T.push('LOG EKSPERIMEN');
  if(!log.length)T.push('(kosong)');
  log.forEach((e,i)=>T.push(`${i+1}. ${e.noise} ${e.amt}% | ${e.f} kernel ${e.k} | MSE ${e.mse.toFixed(1)} | PSNR ${isFinite(e.psnr)?e.psnr.toFixed(2):'tak hingga'} dB`));
  return T.join('\n');
}
$('#exUnduh').onclick=()=>{
  const b=new Blob([laporan()],{type:'text/plain;charset=utf-8'}),a=document.createElement('a'),n=($('#exNama').value.trim()||'siswa').replace(/[^\w-]+/g,'-');
  a.href=URL.createObjectURL(b);a.download=`laporan-filterlab-${n}.txt`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
  $('#exInfo').textContent='Laporan diunduh. Kumpulkan berkas ini sesuai instruksi dosen.';
};
$('#exSalin').onclick=()=>{
  if(!navigator.clipboard){$('#exInfo').textContent='Browser tidak mendukung salin otomatis. Gunakan tombol unduh.';return;}
  navigator.clipboard.writeText(laporan()).then(()=>{$('#exInfo').textContent='Teks laporan disalin.';});
};

initTA();progres();route();

/* ===== Jembatan sinkronisasi (dipakai cloud.js) ===== */
function muatUlang(){
  done=store.get('done',[]);buka=store.get('buka',[]);chk=store.get('chk',[]);
  Object.keys(ta).forEach(k=>delete ta[k]);Object.assign(ta,store.get('ta',{}));
  Object.keys(tat).forEach(k=>delete tat[k]);Object.assign(tat,store.get('tat',{}));
  $$('textarea[data-k]').forEach(t=>{t.value=ta[t.dataset.k]||'';if(t._b){t._b.tampil();syncBahas(t);}});
  $$('#ceklis input').forEach(c=>c.checked=chk.includes(+c.dataset.i));
  const id=store.get('ident',{});$('#exNama').value=id.n||'';$('#exNim').value=id.i||'';
  progres();renderLog();
}
window.FL={store,onChange:null,
  snapshot(){return{done:store.get('done',[]),buka:store.get('buka',[]),chk:store.get('chk',[]),ta:store.get('ta',{}),tat:store.get('tat',{}),log:store.get('log',[]),skor:store.get('skor',null),ident:store.get('ident',{})};},
  apply(d){applying=true;try{Object.keys(d).forEach(k=>store.set(k,d[k]));}finally{applying=false;}muatUlang();}
};