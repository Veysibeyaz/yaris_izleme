**Üretim İzleme Paneli**
Bu proje, üretim verilerini anlık olarak izlemek ve görselleştirmek için geliştirilmiş bir web uygulamasıdır. Kullanıcıların makine bazında üretim verilerini yüklemesine, görüntülemesine ve analiz etmesine olanak tanır.

Proje Hakkında
Uygulama, iki ana bölümden oluşmaktadır:

Backend (Sunucu): Node.js ve Express ile geliştirilmiştir. CSV/Excel dosyalarının yüklenmesi, verilerin işlenmesi ve API aracılığıyla frontend'e sunulmasından sorumludur.

Frontend (Arayüz): React.js kullanılarak geliştirilmiştir. Sunucudan gelen verileri dinamik grafikler ve tablolar halinde kullanıcıya sunar.

Kullanılan Teknolojiler
Backend:

Node.js

Express.js

Multer (Dosya yükleme işlemleri için)

Nodemon (Geliştirme ortamında sunucuyu otomatik yeniden başlatmak için)

XLSX (Excel dosyalarını okumak ve işlemek için)

Frontend:

React.js

React Router (Sayfa yönlendirmeleri için)

Axios (API istekleri için)

Chart.js (Veri görselleştirme ve grafikler için)

Kurulum ve Çalıştırma
Projeyi yerel makinenizde kurmak ve çalıştırmak için aşağıdaki adımları izleyin.

Gereksinimler
Git

Node.js (v16 veya üzeri tavsiye edilir)

npm (Node.js ile birlikte otomatik olarak kurulur)

Adım Adım Kurulum
Projeyi klonlayın (bilgisayarınıza indirin):

Bash

git clone <projenizin_github_linki>
Proje ana klasörüne gidin:

Bash

cd yaris_izleme-main
Adım 1: Backend Sunucusunu Başlatma
Backend'i kurmak için birinci terminalinizi kullanın.

Backend klasörüne girin:

Bash

cd backend
Gerekli paketleri yükleyin:

Bash

npm install
Backend sunucusunu geliştirme modunda başlatın:
Bu komut, kodda değişiklik yaptığınızda sunucunun otomatik olarak yeniden başlamasını sağlar.

Bash

npm run dev
Sunucunun Server is running on port 5000 gibi bir mesaj verdiğini göreceksiniz. Bu terminali kapatmayın, backend'in sürekli çalışması gerekiyor.

Adım 2: Frontend Arayüzünü Başlatma
Şimdi YENİ BİR TERMİNAL açın. (Mevcut olanı kapatmayın, backend orada çalışıyor).

Yeni terminalde proje ana klasörüne geri dönün ve frontend klasörüne girin:

Bash

cd .. 
cd frontend
İpucu: Eğer yaris_izleme-main klasöründeyseniz direkt cd frontend komutunu çalıştırabilirsiniz.

Gerekli paketleri yükleyin:

Bash

npm install
Frontend uygulamasını başlatın:

Bash

npm start
Bu komut, tarayıcınızda otomatik olarak yeni bir sekme açacak ve uygulamayı http://localhost:3000 adresinde çalıştıracaktır.

Özet
Kurulum tamamlandığında, projenin düzgün çalışması için iki terminalin de aynı anda açık ve çalışır durumda olması gerekmektedir:

Backend (API sunucusu)

Frontend (Kullanıcı arayüzü)
