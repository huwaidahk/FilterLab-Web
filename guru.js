import {initializeApp} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import {getAuth,GoogleAuthProvider,signInWithPopup,signOut,onAuthStateChanged} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import {getFirestore,collection,getDocs} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
import {firebaseConfig,UNNES_REGEX} from './firebase-config.js';

const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const TANYA={d1:'Dasar: perbedaan tampilan noise Gaussian dan salt-and-pepper',d2:'Dasar: citra mana yang noise-nya lebih mudah dikenali',d3:'Dasar: efek jendela besar pada tepi objek',s1:'Simulasi: mengapa Mean dan Median berbeda pada piksel pusat',e0:'Analisis 1: filter untuk salt-and-pepper (dengan bukti PSNR)',e1:'Analisis 2: filter untuk noise Gaussian (selisih PSNR)',e2:'Analisis 3: pengaruh ukuran kernel terhadap hasil dan PSNR',e3:'Analisis 4: kesimpulan memilih filter'};
const HALAMAN=8;
let data=[];

if(!firebaseConfig.apiKey||firebaseConfig.apiKey.startsWith('ISI')){
  $('#pesan').textContent='Firebase belum dikonfigurasi. Isi firebase-config.js terlebih dahulu.';$('#masuk').hidden=true;
}else{
  const auth=getAuth(initializeApp(firebaseConfig)),db=getFirestore(auth.app);
  const provider=new GoogleAuthProvider();provider.setCustomParameters({prompt:'select_account'});
  $('#masuk').onclick=()=>signInWithPopup(auth,provider).catch(e=>{$('#pesan').textContent='Gagal masuk: '+(e.code||e.message);});
  $('#keluar').onclick=()=>signOut(auth);
  onAuthStateChanged(auth,async u=>{
    const masuk=!!u;$('#masuk').hidden=masuk;$('#keluar').hidden=!masuk;
    if(!u){tampilkan(false);return;}
    if(!u.emailVerified||!UNNES_REGEX.test(u.email||'')){await signOut(auth);$('#pesan').textContent='Hanya akun UNNES yang dapat masuk.';return;}
    try{
      const snap=await getDocs(collection(db,'siswa'));
      data=snap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>(a.nama||a.email||'').localeCompare(b.nama||b.email||''));
      $('#pesan').textContent=`Masuk sebagai ${u.email}. ${data.length} mahasiswa tercatat.`;tampilkan(true);render();
    }catch(e){
      $('#pesan').textContent=e.code==='permission-denied'?'Akun ini bukan pengajar. Tambahkan emailmu ke daftar admin di firestore.rules lalu deploy ulang.':'Gagal memuat: '+(e.code||e.message);tampilkan(false);
    }
  });
}
function tampilkan(v){['#cari','#csv','#ringkas'].forEach(s=>$(s).hidden=!v);if(!v)$('#daftar').innerHTML='';}
const pct=d=>Math.round(((d.done||[]).length/HALAMAN)*100);
const waktu=d=>d.updatedAt&&d.updatedAt.toDate?d.updatedAt.toDate().toLocaleString('id-ID'):'-';
function render(){
  const q=$('#cari').value.toLowerCase();
  const f=data.filter(d=>[d.nama,d.email,d.nim].join(' ').toLowerCase().includes(q));
  const rata=data.length?Math.round(data.reduce((a,d)=>a+pct(d),0)/data.length):0;
  const sk=data.filter(d=>typeof d.skor==='number');
  $('#ringkas').innerHTML=`<div class="stat"><b>${data.length}</b>mahasiswa</div><div class="stat"><b>${rata}%</b>rata-rata progres</div><div class="stat"><b>${data.filter(d=>pct(d)===100).length}</b>selesai semua</div><div class="stat"><b>${sk.length?(sk.reduce((a,d)=>a+d.skor,0)/sk.length).toFixed(1):'-'}</b>rata-rata skor kuis</div>`;
  $('#daftar').innerHTML=f.map(d=>`<details class="s"><summary><b>${esc(d.nama||'(tanpa nama)')}</b><span>${esc(d.email)}</span><span class="pill">NIM ${esc(d.nim||'-')}</span><span class="pill">Progres ${pct(d)}%</span><span class="pill">Skor ${typeof d.skor==='number'?d.skor+' dari 11':'-'}</span></summary><p class="hint">Terakhir diperbarui: ${esc(waktu(d))}</p>`+
    Object.keys(TANYA).map(k=>`<p><b>${esc(TANYA[k])}</b></p><div class="jw">${esc((d.ta&&d.ta[k])||'(belum dijawab)')}</div>`).join('')+
    `<p><b>Log eksperimen (${(d.log||[]).length})</b></p><div class="tbl"><table><tr><th>Noise</th><th>Tingkat</th><th>Filter</th><th>Kernel</th><th>MSE</th><th>PSNR</th></tr>`+
    (d.log||[]).map(e=>`<tr><td>${esc(e.noise)}</td><td>${e.amt}%</td><td>${esc(e.f)}</td><td>${e.k}</td><td>${Number(e.mse).toFixed(1)}</td><td>${isFinite(e.psnr)?Number(e.psnr).toFixed(2):'tak hingga'}</td></tr>`).join('')+`</table></div></details>`).join('')||'<p>Tidak ada data yang cocok.</p>';
}
$('#cari').oninput=render;
$('#csv').onclick=()=>{
  const kol=['nama','email','nim','progres_persen','skor','jumlah_log','diperbarui',...Object.keys(TANYA)];
  const q=v=>'"'+String(v??'').replace(/"/g,'""')+'"';
  const baris=data.map(d=>[d.nama,d.email,d.nim,pct(d),d.skor??'',(d.log||[]).length,waktu(d),...Object.keys(TANYA).map(k=>(d.ta&&d.ta[k])||'')].map(q).join(','));
  const blob=new Blob(['\ufeff'+[kol.join(','),...baris].join('\n')],{type:'text/csv;charset=utf-8'}),a=document.createElement('a');
  a.href=URL.createObjectURL(blob);a.download='hasil-filterlab.csv';document.body.appendChild(a);a.click();a.remove();
};
