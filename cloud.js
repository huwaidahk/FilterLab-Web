import {initializeApp} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import {getAuth,GoogleAuthProvider,signInWithPopup,signOut,onAuthStateChanged} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import {getFirestore,doc,getDoc,setDoc,serverTimestamp} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
import {firebaseConfig,UNNES_REGEX} from './firebase-config.js';

const $=s=>document.querySelector(s),FL=window.FL;
const info=$('#akunInfo'),stat=$('#cloudStatus'),inBtn=$('#loginBtn'),outBtn=$('#logoutBtn');
const awal=info.textContent;

if(!firebaseConfig.apiKey||firebaseConfig.apiKey.startsWith('ISI')){
  info.textContent='Mode lokal: Firebase belum dikonfigurasi. Progres, jawaban, dan log eksperimen hanya tersimpan di browser perangkat ini.';inBtn.hidden=true;
}else{
  const app=initializeApp(firebaseConfig),auth=getAuth(app),db=getFirestore(app);
  const provider=new GoogleAuthProvider();provider.setCustomParameters({prompt:'select_account'});
  let ref=null,timer=null;
  const jam=()=>new Date().toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'});
  const uni=(a,b)=>[...new Set([...(a||[]),...(b||[])])];

  function gabung(l,c){
    const ta={},tat={},kunci=new Set([...Object.keys(l.ta||{}),...Object.keys(c.ta||{})]);
    kunci.forEach(k=>{
      const tl=(l.tat||{})[k]||0,tc=(c.tat||{})[k]||0,adaC=c.ta&&c.ta[k]!==undefined,adaL=l.ta&&l.ta[k];
      ta[k]=(adaC&&(!adaL||tc>tl))?c.ta[k]:((l.ta||{})[k]||'');tat[k]=Math.max(tl,tc);
    });
    const seen=new Set(),log=[];
    [...(c.log||[]),...(l.log||[])].forEach(e=>{const s=JSON.stringify(e);if(!seen.has(s)){seen.add(s);log.push(e);}});
    const sk=[l.skor,c.skor].filter(v=>typeof v==='number');
    return{done:uni(l.done,c.done),buka:uni(l.buka,c.buka),chk:uni(l.chk,c.chk),ta,tat,log:log.slice(-30),
      skor:sk.length?Math.max(...sk):null,ident:(l.ident&&(l.ident.n||l.ident.i))?l.ident:(c.ident||{})};
  }
  async function dorong(){
    if(!ref)return;
    try{
      stat.textContent='Menyimpan...';const d=FL.snapshot(),u=auth.currentUser;
      await setDoc(ref,{...d,nama:u.displayName||'',email:u.email,nim:(d.ident&&d.ident.i)||'',updatedAt:serverTimestamp()});
      stat.textContent='Tersinkron pukul '+jam();
    }catch(e){stat.textContent='Gagal menyimpan: '+(e.code||e.message);}
  }
  FL.onChange=()=>{if(!ref)return;clearTimeout(timer);stat.textContent='Menunggu penyimpanan...';timer=setTimeout(dorong,1500);};

  inBtn.onclick=async()=>{
    if(!FL.store.get('setuju',false)){
      if(!confirm('Data yang disimpan di server: nama, email student UNNES, NIM (jika kamu isi), progres, jawaban, skor, dan log eksperimen. Lanjutkan?'))return;
      FL.store.set('setuju',true);
    }
    try{await signInWithPopup(auth,provider);}
    catch(e){if(!['auth/popup-closed-by-user','auth/cancelled-popup-request'].includes(e.code))stat.textContent='Gagal masuk: '+(e.code||e.message);}
  };
  outBtn.onclick=async()=>{clearTimeout(timer);await dorong();ref=null;await signOut(auth);};

  onAuthStateChanged(auth,async user=>{
    if(!user){ref=null;info.textContent=awal;inBtn.hidden=false;outBtn.hidden=true;return;}
    if(!user.emailVerified||!UNNES_REGEX.test(user.email||'')){
      await signOut(auth);stat.textContent='Hanya email student UNNES (@students.unnes.ac.id) yang dapat masuk. Akun yang dipakai: '+(user.email||'-');return;
    }
    ref=doc(db,'siswa',user.uid);
    info.textContent='Masuk sebagai '+(user.displayName||'')+' ('+user.email+')';inBtn.hidden=true;outBtn.hidden=false;
    try{
      const s=await getDoc(ref);
      FL.apply(s.exists()?gabung(FL.snapshot(),s.data()):FL.snapshot());
      await dorong();
    }catch(e){stat.textContent='Gagal memuat data: '+(e.code||e.message);}
  });
}
